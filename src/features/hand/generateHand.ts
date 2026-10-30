import {
  isHonor,
  isSimple,
  rankOf,
  suitOf,
  TILE_KIND_COUNT,
  WIND,
  type Tile,
  type TileKind,
  type Wind,
} from '@/features/tiles/tile';
import { analyzeFu, type FuAnalysis } from './analyzeFu';
import {
  isMenzen,
  isValueTile,
  type CalledMeld,
  type WinningHand,
} from './types';

export type Rng = () => number;

export type HandFilters = {
  /** 門前の手だけにするか、副露した手も出すか */
  melds: 'closedOnly' | 'any';
  win: 'tsumo' | 'ron' | 'both';
  includeChiitoi: boolean;
};

export type GeneratedHand = {
  hand: WinningHand;
  analysis: Extract<FuAnalysis, { ok: true }>;
};

/** 条件に合う手が見つかるまでに試す回数の上限 */
const MAX_ATTEMPTS = 2000;
const CHIITOI_RATE = 0.12;
const RED_FIVE_RATE = 0.4;
/** 副露の数の出やすさ（0〜3個） */
const CALLED_COUNT_WEIGHTS: readonly (readonly [number, number])[] = [
  [0, 0.3],
  [1, 0.35],
  [2, 0.25],
  [3, 0.1],
];
const SET_TYPE_WEIGHTS: readonly (readonly [SetPlan['type'], number])[] = [
  ['sequence', 0.55],
  ['triplet', 0.35],
  ['quad', 0.1],
];
const ROUND_WINDS: readonly Wind[] = [WIND.east, WIND.south];
const SEAT_WINDS: readonly Wind[] = [
  WIND.east,
  WIND.south,
  WIND.west,
  WIND.north,
];

const randomInt = (n: number, rng: Rng) => Math.floor(rng() * n);

function pick<T>(items: readonly T[], rng: Rng): T {
  const item = items[randomInt(items.length, rng)];
  if (item === undefined) throw new Error('候補が空です');
  return item;
}

/** [値, 重み] の組から、重みに比例して1つ選ぶ（重みの合計は 1） */
function weighted<T>(entries: readonly (readonly [T, number])[], rng: Rng): T {
  let r = rng();
  for (const [value, w] of entries) {
    if (r < w) return value;
    r -= w;
  }
  const last = entries.at(-1);
  if (!last) throw new Error('重みが空です');
  return last[0];
}

type SetPlan = { type: 'sequence' | 'triplet' | 'quad'; kind: TileKind };

const tilesOfSet = ({ type, kind }: SetPlan): TileKind[] =>
  type === 'sequence'
    ? [kind, kind + 1, kind + 2]
    : new Array<TileKind>(type === 'triplet' ? 3 : 4).fill(kind);

/** 1種類につき4枚までの残りを見ながら、面子を1つ選ぶ */
function pickSet(remaining: number[], rng: Rng): SetPlan | null {
  for (let tries = 0; tries < 20; tries++) {
    const type = weighted(SET_TYPE_WEIGHTS, rng);
    const kind = randomInt(TILE_KIND_COUNT, rng);
    if (type === 'sequence' && (isHonor(kind) || rankOf(kind) > 7)) continue;
    const plan = { type, kind };
    const need = tilesOfSet(plan);
    const fits = need.every(
      (k) => (remaining[k] ?? 0) >= need.filter((x) => x === k).length
    );
    if (!fits) continue;
    for (const k of need) remaining[k] = (remaining[k] ?? 0) - 1;
    return plan;
  }
  return null;
}

/** 5 の牌のうち、各色1枚までを赤にする */
function paintRedFives(groups: Tile[][], rng: Rng): void {
  const painted = new Set<string>();
  for (const tile of groups.flat()) {
    if (isHonor(tile.kind) || rankOf(tile.kind) !== 5) continue;
    const suit = suitOf(tile.kind);
    if (painted.has(suit) || rng() >= RED_FIVE_RATE) continue;
    tile.red = true;
    painted.add(suit);
  }
}

const toTiles = (kinds: TileKind[]): Tile[] =>
  kinds.map((kind) => ({ kind, red: false }));

/**
 * 役のない手を出さないための簡易判定（役の判定は Lv3 で作る）。
 * 門前はリーチを付けるので必ず役がある。副露した手は、役牌の刻子か断么九に限る。
 */
function hasSimpleYaku(hand: WinningHand, closedTriplets: TileKind[]): boolean {
  if (isMenzen(hand)) return true;
  const tripletKinds = [
    ...closedTriplets,
    ...hand.melds
      .filter((m) => m.type !== 'chi')
      .flatMap((m) => m.tiles[0]?.kind ?? []),
  ];
  if (tripletKinds.some((k) => isValueTile(k, hand))) return true;
  const all = [
    ...hand.concealed,
    hand.winTile,
    ...hand.melds.flatMap((m) => m.tiles),
  ];
  return all.every((t) => isSimple(t.kind));
}

function chooseTsumo(win: HandFilters['win'], rng: Rng): boolean {
  return win === 'both' ? rng() < 0.5 : win === 'tsumo';
}

function tryChiitoi(filters: HandFilters, rng: Rng): WinningHand {
  const kinds = new Set<TileKind>();
  while (kinds.size < 7) kinds.add(randomInt(TILE_KIND_COUNT, rng));
  const pairs = [...kinds].map((k) => toTiles([k, k]));
  paintRedFives(pairs, rng);
  const winPair = pick(pairs, rng);
  const winTile = winPair[1];
  if (!winTile) throw new Error('和了牌がありません');
  return {
    concealed: pairs.flat().filter((t) => t !== winTile),
    melds: [],
    winTile,
    isTsumo: chooseTsumo(filters.win, rng),
    roundWind: pick(ROUND_WINDS, rng),
    seatWind: pick(SEAT_WINDS, rng),
    riichi: true,
  };
}

function tryStandard(
  filters: HandFilters,
  rng: Rng
): { hand: WinningHand; closedTriplets: TileKind[] } | null {
  const remaining = new Array<number>(TILE_KIND_COUNT).fill(4);
  const plans: SetPlan[] = [];
  for (let i = 0; i < 4; i++) {
    const plan = pickSet(remaining, rng);
    if (!plan) return null;
    plans.push(plan);
  }
  const pairKind = randomInt(TILE_KIND_COUNT, rng);
  if ((remaining[pairKind] ?? 0) < 2) return null;

  const calledCount =
    filters.melds === 'any' ? weighted(CALLED_COUNT_WEIGHTS, rng) : 0;

  const melds: CalledMeld[] = [];
  const closedGroups: Tile[][] = [];
  const closedTriplets: TileKind[] = [];
  plans.forEach((plan, i) => {
    const tiles = toTiles(tilesOfSet(plan));
    if (i < calledCount) {
      const type =
        plan.type === 'sequence'
          ? 'chi'
          : plan.type === 'triplet'
            ? 'pon'
            : 'minkan';
      melds.push({ type, tiles });
    } else if (plan.type === 'quad') {
      melds.push({ type: 'ankan', tiles });
    } else {
      closedGroups.push(tiles);
      if (plan.type === 'triplet') closedTriplets.push(plan.kind);
    }
  });
  closedGroups.push(toTiles([pairKind, pairKind]));
  paintRedFives([...closedGroups, ...melds.map((m) => m.tiles)], rng);

  const closedTiles = closedGroups.flat();
  const winTile = pick(closedTiles, rng);
  const hand: WinningHand = {
    concealed: closedTiles.filter((t) => t !== winTile),
    melds,
    winTile,
    isTsumo: chooseTsumo(filters.win, rng),
    roundWind: pick(ROUND_WINDS, rng),
    seatWind: pick(SEAT_WINDS, rng),
    riichi: false,
  };
  hand.riichi = isMenzen(hand);
  return { hand, closedTriplets };
}

/** Lv2 の出題に使える和了手を1つ作る */
export function generateFuHand(filters: HandFilters, rng: Rng): GeneratedHand {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let hand: WinningHand;
    if (filters.includeChiitoi && rng() < CHIITOI_RATE) {
      hand = tryChiitoi(filters, rng);
    } else {
      const built = tryStandard(filters, rng);
      if (!built || !hasSimpleYaku(built.hand, built.closedTriplets)) continue;
      hand = built.hand;
    }
    const analysis = analyzeFu(hand);
    if (analysis.ok) return { hand, analysis };
  }
  throw new Error('条件に合う手を作れませんでした');
}
