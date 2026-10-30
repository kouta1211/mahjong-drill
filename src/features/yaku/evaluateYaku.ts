import { calcFu } from '@/features/hand/calcFu';
import {
  isMenzen,
  type Interpretation,
  type WinningHand,
} from '@/features/hand/types';
import {
  DRAGONS,
  isHonor,
  isYaochu,
  kindOf,
  rankOf,
  suitOf,
  WIND,
  type TileKind,
} from '@/features/tiles/tile';
import { hanOf, type YakuId, type YakumanId } from './yakuList';

/** 面子1つ。手の中の面子と副露を同じ形にそろえたもの */
type Block = {
  type: 'sequence' | 'triplet' | 'quad';
  kind: TileKind;
  /** 暗刻・暗槓、または手の中の順子 */
  concealed: boolean;
};

export type YakuHit = { id: YakuId; han: number };

export type YakuEvaluation =
  | { kind: 'yakuman'; yakuman: YakumanId[] }
  | { kind: 'normal'; yaku: YakuHit[]; han: number };

const blockKinds = (b: Block): TileKind[] =>
  b.type === 'sequence' ? [b.kind, b.kind + 1, b.kind + 2] : [b.kind];

function blocksOf(
  hand: WinningHand,
  it: Extract<Interpretation, { form: 'standard' }>
): Block[] {
  const blocks: Block[] = it.sets.map((set, i) => ({
    type: set.type,
    kind: set.kind,
    // ロンで完成した刻子は明刻（符と同じ扱い。docs/requirements.md 6章）
    concealed: !(
      set.type === 'triplet' &&
      i === it.completedSetIndex &&
      !hand.isTsumo
    ),
  }));
  for (const meld of hand.melds) {
    const kind = Math.min(...meld.tiles.map((t) => t.kind));
    blocks.push({
      type:
        meld.type === 'chi'
          ? 'sequence'
          : meld.type === 'pon'
            ? 'triplet'
            : 'quad',
      kind,
      concealed: meld.type === 'ankan',
    });
  }
  return blocks;
}

const allKinds = (hand: WinningHand): TileKind[] =>
  [...hand.concealed, hand.winTile, ...hand.melds.flatMap((m) => m.tiles)].map(
    (t) => t.kind
  );

const NUMBER_SUITS = ['m', 'p', 's'] as const;
const WIND_KINDS: readonly TileKind[] = Object.values(WIND);
const DRAGON_YAKU: ReadonlyMap<TileKind, YakuId> = new Map([
  [kindOf('z', 5), 'haku'],
  [kindOf('z', 6), 'hatsu'],
  [kindOf('z', 7), 'chun'],
]);
const GREEN_KINDS: readonly TileKind[] = [
  ...[2, 3, 4, 6, 8].map((r) => kindOf('s', r)),
  kindOf('z', 6),
];

/** 一色手の判定（混一色・清一色・字一色） */
function flushOf(
  kinds: TileKind[]
): 'chinitsu' | 'honitsu' | 'tsuuiisou' | null {
  const suits = new Set(kinds.filter((k) => !isHonor(k)).map(suitOf));
  const hasHonor = kinds.some(isHonor);
  if (suits.size === 0) return 'tsuuiisou';
  if (suits.size > 1) return null;
  return hasHonor ? 'honitsu' : 'chinitsu';
}

/** 老頭牌・字牌だけでできているか（混老頭・清老頭・字一色） */
function terminalHonorOf(kinds: TileKind[]): 'honroutou' | 'chinroutou' | null {
  if (!kinds.every(isYaochu)) return null;
  if (kinds.every(isHonor)) return null; // 字一色として別に判定する
  return kinds.some(isHonor) ? 'honroutou' : 'chinroutou';
}

function evaluateChiitoi(hand: WinningHand): YakuEvaluation {
  const kinds = allKinds(hand);
  const flush = flushOf(kinds);
  if (flush === 'tsuuiisou') return { kind: 'yakuman', yakuman: ['tsuuiisou'] };
  const ids: YakuId[] = ['chiitoitsu'];
  if (hand.riichi) ids.push('riichi');
  if (hand.isTsumo) ids.push('menzenTsumo');
  if (kinds.every((k) => !isYaochu(k))) ids.push('tanyao');
  if (terminalHonorOf(kinds) === 'honroutou') ids.push('honroutou');
  if (flush) ids.push(flush);
  return withHan(ids, true);
}

function withHan(ids: YakuId[], menzen: boolean): YakuEvaluation {
  const yaku = ids.flatMap((id) => {
    const han = hanOf(id, menzen);
    return han === null ? [] : [{ id, han }];
  });
  return { kind: 'normal', yaku, han: yaku.reduce((s, y) => s + y.han, 0) };
}

/** 1つの解釈について、成立する役を判定する */
export function evaluateYaku(
  hand: WinningHand,
  it: Interpretation
): YakuEvaluation {
  if (it.form === 'chiitoi') return evaluateChiitoi(hand);

  const menzen = isMenzen(hand);
  const blocks = blocksOf(hand, it);
  const kinds = allKinds(hand);
  const triplets = blocks.filter((b) => b.type !== 'sequence');
  const sequences = blocks.filter((b) => b.type === 'sequence');
  const tripletKinds = triplets.map((b) => b.kind);
  const concealedTriplets = triplets.filter((b) => b.concealed).length;
  const quads = blocks.filter((b) => b.type === 'quad').length;
  const dragonTriplets = tripletKinds.filter((k) =>
    (DRAGONS as readonly number[]).includes(k)
  );
  const windTriplets = tripletKinds.filter((k) => WIND_KINDS.includes(k));
  const flush = flushOf(kinds);
  const terminalHonor = terminalHonorOf(kinds);

  // 役満（Lv3 では出題しないので、成立したかだけ分かればよい）
  const yakuman: YakumanId[] = [];
  if (concealedTriplets === 4) yakuman.push('suuankou');
  if (dragonTriplets.length === 3) yakuman.push('daisangen');
  if (flush === 'tsuuiisou') yakuman.push('tsuuiisou');
  if (windTriplets.length === 4) yakuman.push('daisuushii');
  else if (windTriplets.length === 3 && WIND_KINDS.includes(it.pair)) {
    yakuman.push('shousuushii');
  }
  if (terminalHonor === 'chinroutou') yakuman.push('chinroutou');
  if (kinds.every((k) => GREEN_KINDS.includes(k))) yakuman.push('ryuuiisou');
  if (quads === 4) yakuman.push('suukantsu');
  if (menzen && flush === 'chinitsu' && isChuurenShape(kinds))
    yakuman.push('chuuren');
  if (yakuman.length > 0) return { kind: 'yakuman', yakuman };

  const ids: YakuId[] = [];
  if (hand.riichi) ids.push('riichi');
  if (menzen && hand.isTsumo) ids.push('menzenTsumo');
  if (calcFu(hand, it).isPinfu) ids.push('pinfu');
  if (kinds.every((k) => !isYaochu(k))) ids.push('tanyao');

  // 一盃口・二盃口: 門前で、同じ順子の組がいくつあるか
  if (menzen) {
    const counts = new Map<TileKind, number>();
    for (const s of sequences)
      counts.set(s.kind, (counts.get(s.kind) ?? 0) + 1);
    const pairs = [...counts.values()].reduce(
      (n, c) => n + Math.floor(c / 2),
      0
    );
    if (pairs >= 2) ids.push('ryanpeikou');
    else if (pairs === 1) ids.push('iipeikou');
  }

  // 役牌
  for (const k of dragonTriplets) {
    const id = DRAGON_YAKU.get(k);
    if (id) ids.push(id);
  }
  if (tripletKinds.includes(hand.seatWind)) {
    ids.push(hand.seatWind === hand.roundWind ? 'doubleWind' : 'seatWind');
  }
  if (
    hand.seatWind !== hand.roundWind &&
    tripletKinds.includes(hand.roundWind)
  ) {
    ids.push('roundWind');
  }

  if (triplets.length === 4) ids.push('toitoi');
  if (concealedTriplets === 3) ids.push('sanankou');
  if (quads === 3) ids.push('sankantsu');
  if (
    dragonTriplets.length === 2 &&
    (DRAGONS as readonly number[]).includes(it.pair)
  ) {
    ids.push('shousangen');
  }

  // 三色同刻・三色同順・一気通貫
  const sameRankInAllSuits = (list: Block[]) =>
    list.some(
      (b) =>
        !isHonor(b.kind) &&
        NUMBER_SUITS.every((suit) =>
          list.some(
            (o) =>
              !isHonor(o.kind) &&
              suitOf(o.kind) === suit &&
              rankOf(o.kind) === rankOf(b.kind)
          )
        )
    );
  if (sameRankInAllSuits(triplets)) ids.push('sanshokuDoukou');
  if (sameRankInAllSuits(sequences)) ids.push('sanshoku');
  if (
    NUMBER_SUITS.some((suit) =>
      [1, 4, 7].every((r) => sequences.some((s) => s.kind === kindOf(suit, r)))
    )
  ) {
    ids.push('ittsu');
  }

  // 混老頭 > 純全帯么九 > 全帯么九（混老頭が付く手にはチャンタ系を付けない）
  if (terminalHonor === 'honroutou') {
    ids.push('honroutou');
  } else {
    const groups = [...blocks.map(blockKinds), [it.pair]];
    if (groups.every((g) => g.some(isYaochu))) {
      ids.push(kinds.some(isHonor) ? 'chanta' : 'junchan');
    }
  }
  if (flush === 'honitsu' || flush === 'chinitsu') ids.push(flush);

  return withHan(ids, menzen);
}

/** 九蓮宝燈: 同じ色で 1112345678999 ＋ どれか1枚 */
function isChuurenShape(kinds: TileKind[]): boolean {
  const counts = new Array<number>(9).fill(0);
  for (const k of kinds)
    counts[rankOf(k) - 1] = (counts[rankOf(k) - 1] ?? 0) + 1;
  const base = [3, 1, 1, 1, 1, 1, 1, 1, 3];
  return counts.every((c, i) => c >= (base[i] ?? 0));
}
