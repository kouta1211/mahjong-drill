import {
  isMenzen,
  type CalledMeld,
  type WinningHand,
} from '@/features/hand/types';
import {
  DRAGONS,
  isHonor,
  isSimple,
  isYaochu,
  kindOf,
  rankOf,
  suitOf,
  TILE_KIND_COUNT,
  WIND,
  type Tile,
  type TileKind,
  type Wind,
} from '@/features/tiles/tile';
import type { Rng } from '@/lib/rng';

export type HandFilters = {
  /** 門前の手だけにするか、副露した手も出すか */
  melds: 'closedOnly' | 'any';
  win: 'tsumo' | 'ron' | 'both';
  includeChiitoi: boolean;
};

export type BuildOptions = {
  /** 赤5を混ぜるか（Lv3 はドラを扱わないので混ぜない） */
  redFives: boolean;
  /** 門前の手にリーチを付ける割合（Lv2 は役を保証するため 1） */
  riichiRate: number;
};

/** 条件に合う手が見つかるまでに試す回数の上限 */
const MAX_ATTEMPTS = 3000;
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
const SEAT_WINDS: readonly Wind[] = Object.values(WIND);
const NUMBER_SUITS = ['m', 'p', 's'] as const;

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

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    const a = result[i];
    const b = result[j];
    if (a === undefined || b === undefined) continue;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

type SetPlan = { type: 'sequence' | 'triplet' | 'quad'; kind: TileKind };

const tilesOfSet = ({ type, kind }: SetPlan): TileKind[] =>
  type === 'sequence'
    ? [kind, kind + 1, kind + 2]
    : new Array<TileKind>(type === 'triplet' ? 3 : 4).fill(kind);

/**
 * 役を狙った手の組み立て方。fixed は先に置く面子、allowSet / allowPair は残りの面子と雀頭の条件。
 * ランダムに組むと立直・断么九・役牌ばかりになるため、一定の割合でこれらを使う。
 */
type Theme = {
  fixed: SetPlan[];
  allowSet: (plan: SetPlan) => boolean;
  allowPair: (kind: TileKind) => boolean;
};

const anything = () => true;
const kindsOfPlan = (plan: SetPlan) => tilesOfSet(plan);

function pickTheme(rng: Rng): Theme {
  const suit = pick(NUMBER_SUITS, rng);
  const inSuit = (k: TileKind) => !isHonor(k) && suitOf(k) === suit;
  const free: Theme = { fixed: [], allowSet: anything, allowPair: anything };
  const themes: readonly (readonly [() => Theme, number])[] = [
    [() => free, 0.3],
    // 混一色: 1色＋字牌
    [
      () => ({
        fixed: [],
        allowSet: (p) => kindsOfPlan(p).every((k) => inSuit(k) || isHonor(k)),
        allowPair: (k) => inSuit(k) || isHonor(k),
      }),
      0.1,
    ],
    // 清一色: 1色だけ
    [
      () => ({
        fixed: [],
        allowSet: (p) => kindsOfPlan(p).every(inSuit),
        allowPair: inSuit,
      }),
      0.06,
    ],
    // 対々和: 刻子・槓子だけ
    [
      () => ({
        fixed: [],
        allowSet: (p) => p.type !== 'sequence',
        allowPair: anything,
      }),
      0.08,
    ],
    // 全帯么九: どの面子にも么九牌を含める
    [
      () => ({
        fixed: [],
        allowSet: (p) => kindsOfPlan(p).some(isYaochu),
        allowPair: isYaochu,
      }),
      0.08,
    ],
    // 断么九: 中張牌だけ
    [
      () => ({
        fixed: [],
        allowSet: (p) => kindsOfPlan(p).every(isSimple),
        allowPair: isSimple,
      }),
      0.1,
    ],
    // 三色同順
    [
      () => {
        const rank = 1 + randomInt(7, rng);
        return {
          fixed: NUMBER_SUITS.map((s) => ({
            type: 'sequence' as const,
            kind: kindOf(s, rank),
          })),
          allowSet: anything,
          allowPair: anything,
        };
      },
      0.08,
    ],
    // 一気通貫
    [
      () => ({
        fixed: [1, 4, 7].map((r) => ({
          type: 'sequence' as const,
          kind: kindOf(suit, r),
        })),
        allowSet: anything,
        allowPair: anything,
      }),
      0.07,
    ],
    // 一盃口
    [
      () => {
        const kind = kindOf(suit, 1 + randomInt(7, rng));
        return {
          fixed: [
            { type: 'sequence', kind },
            { type: 'sequence', kind },
          ],
          allowSet: anything,
          allowPair: anything,
        };
      },
      0.07,
    ],
    // 役牌
    [
      () => ({
        fixed: [
          {
            type: 'triplet',
            kind: pick([...DRAGONS, ...Object.values(WIND)], rng),
          },
        ],
        allowSet: anything,
        allowPair: anything,
      }),
      0.06,
    ],
  ];
  return weighted(themes, rng)();
}

/** 1種類につき4枚までの残りを見ながら、条件に合う面子を1つ選ぶ */
function pickSet(
  remaining: number[],
  allow: Theme['allowSet'],
  rng: Rng
): SetPlan | null {
  for (let tries = 0; tries < 60; tries++) {
    const type = weighted(SET_TYPE_WEIGHTS, rng);
    const kind = randomInt(TILE_KIND_COUNT, rng);
    if (type === 'sequence' && (isHonor(kind) || rankOf(kind) > 7)) continue;
    const plan = { type, kind };
    if (!allow(plan) || !take(remaining, plan)) continue;
    return plan;
  }
  return null;
}

/** 残り枚数から面子の分を引く。足りなければ何もしないで false */
function take(remaining: number[], plan: SetPlan): boolean {
  const need = tilesOfSet(plan);
  const fits = need.every(
    (k) => (remaining[k] ?? 0) >= need.filter((x) => x === k).length
  );
  if (!fits) return false;
  for (const k of need) remaining[k] = (remaining[k] ?? 0) - 1;
  return true;
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

function chooseTsumo(win: HandFilters['win'], rng: Rng): boolean {
  return win === 'both' ? rng() < 0.5 : win === 'tsumo';
}

function buildChiitoi(
  filters: HandFilters,
  options: BuildOptions,
  rng: Rng
): WinningHand {
  const kinds = new Set<TileKind>();
  while (kinds.size < 7) kinds.add(randomInt(TILE_KIND_COUNT, rng));
  const pairs = [...kinds].map((k) => toTiles([k, k]));
  if (options.redFives) paintRedFives(pairs, rng);
  const winTile = pick(pairs, rng)[1];
  if (!winTile) throw new Error('和了牌がありません');
  return {
    concealed: pairs.flat().filter((t) => t !== winTile),
    melds: [],
    winTile,
    isTsumo: chooseTsumo(filters.win, rng),
    roundWind: pick(ROUND_WINDS, rng),
    seatWind: pick(SEAT_WINDS, rng),
    riichi: rng() < options.riichiRate,
  };
}

function buildStandard(
  filters: HandFilters,
  options: BuildOptions,
  rng: Rng
): WinningHand | null {
  const theme = pickTheme(rng);
  const remaining = new Array<number>(TILE_KIND_COUNT).fill(4);
  const plans: SetPlan[] = [];
  for (const plan of theme.fixed) {
    if (!take(remaining, plan)) return null;
    plans.push(plan);
  }
  while (plans.length < 4) {
    const plan = pickSet(remaining, theme.allowSet, rng);
    if (!plan) return null;
    plans.push(plan);
  }
  const pairKind = randomInt(TILE_KIND_COUNT, rng);
  if ((remaining[pairKind] ?? 0) < 2 || !theme.allowPair(pairKind)) return null;

  const calledCount =
    filters.melds === 'any' ? weighted(CALLED_COUNT_WEIGHTS, rng) : 0;
  const melds: CalledMeld[] = [];
  const closedGroups: Tile[][] = [];
  // 狙いの面子がいつも副露にならないよう、並びを混ぜてから前から副露にする
  shuffle(plans, rng).forEach((plan, i) => {
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
    }
  });
  closedGroups.push(toTiles([pairKind, pairKind]));
  if (options.redFives)
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
  hand.riichi = isMenzen(hand) && rng() < options.riichiRate;
  return hand;
}

/**
 * 手を組み立て、accept が受け入れるまで繰り返す。
 * accept は出題に使えない手なら null を返す（Lv2・Lv3 でそれぞれ条件が違う）。
 */
export function buildHand<T>(
  filters: HandFilters,
  options: BuildOptions,
  rng: Rng,
  accept: (hand: WinningHand) => T | null
): { hand: WinningHand; result: T } {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const hand =
      filters.includeChiitoi && rng() < CHIITOI_RATE
        ? buildChiitoi(filters, options, rng)
        : buildStandard(filters, options, rng);
    if (!hand) continue;
    const result = accept(hand);
    if (result !== null) return { hand, result };
  }
  throw new Error('条件に合う手を作れませんでした');
}
