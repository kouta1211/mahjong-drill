import type { WinningHand } from '@/features/hand/types';
import { calcScore, type ScoreResult } from '@/features/score/calcScore';
import { countDora, type DoraCount } from '@/features/score/dora';
import {
  countKinds,
  TILE_KIND_COUNT,
  WIND,
  type Tile,
} from '@/features/tiles/tile';
import { analyzeHand, type HandAnalysis } from '@/features/yaku/analyzeHand';
import { pick } from '@/lib/random';
import type { Rng } from '@/lib/rng';
import { buildHand, type HandFilters } from './buildHand';

/** 門前の手にリーチを付ける割合（Lv3 と同じ考え方） */
const RIICHI_RATE = 0.6;

export type SeatFilter = 'dealer' | 'nonDealer' | 'both';

export type GeneratedScoreHand = {
  hand: WinningHand;
  /** ドラ表示牌（1 ＋ 槓の数） */
  indicators: Tile[];
  /** 裏ドラ表示牌。立直していなければ空 */
  uraIndicators: Tile[];
  analysis: Extract<HandAnalysis, { ok: true }>;
  dora: DoraCount;
  isDealer: boolean;
  /** 役の翻 ＋ ドラの翻 */
  han: number;
  score: ScoreResult;
};

const seatMatches = (seat: SeatFilter, isDealer: boolean) =>
  seat === 'both' || (seat === 'dealer') === isDealer;

/** 手牌と、すでに選んだ表示牌を引いた残りから、表示牌を count 枚選ぶ */
function pickIndicators(used: Tile[], count: number, rng: Rng): Tile[] {
  const remaining = countKinds(used).map((n) => 4 - n);
  const picked: Tile[] = [];
  for (let i = 0; i < count; i++) {
    const kinds = Array.from({ length: TILE_KIND_COUNT }, (_, k) => k).filter(
      (k) => (remaining[k] ?? 0) > 0
    );
    const kind = pick(kinds, rng);
    remaining[kind] = (remaining[kind] ?? 0) - 1;
    picked.push({ kind, red: false });
  }
  return picked;
}

/**
 * Lv4 の出題に使える和了手を1つ作り、ドラと点数まで求める。
 * ドラは役ではないので、役と高点法の結果（analyzeHand）にあとから翻を足す。
 * ドラの枚数はどの解釈でも同じなので、解釈の選び方は変わらない。
 */
export function generateScoreHand(
  filters: HandFilters & { seat: SeatFilter },
  rng: Rng
): GeneratedScoreHand {
  const { hand, result: analysis } = buildHand(
    filters,
    { redFives: true, riichiRate: RIICHI_RATE },
    rng,
    (hand) => {
      if (!seatMatches(filters.seat, hand.seatWind === WIND.east)) return null;
      const analysis = analyzeHand(hand);
      return analysis.ok ? analysis : null;
    }
  );

  const handTiles = [
    ...hand.concealed,
    hand.winTile,
    ...hand.melds.flatMap((m) => m.tiles),
  ];
  const quads = hand.melds.filter(
    (m) => m.type === 'minkan' || m.type === 'ankan'
  ).length;
  const indicators = pickIndicators(handTiles, 1 + quads, rng);
  const uraIndicators = hand.riichi
    ? pickIndicators([...handTiles, ...indicators], indicators.length, rng)
    : [];
  return {
    hand,
    indicators,
    uraIndicators,
    ...scoreHand(hand, analysis, indicators, uraIndicators),
  };
}

/** 役と高点法の結果にドラの翻を足し、親子を踏まえて点数を出す（乱数を使わない） */
export function scoreHand(
  hand: WinningHand,
  analysis: Extract<HandAnalysis, { ok: true }>,
  indicators: readonly Tile[],
  uraIndicators: readonly Tile[]
): Pick<
  GeneratedScoreHand,
  'analysis' | 'dora' | 'isDealer' | 'han' | 'score'
> {
  const dora = countDora(hand, indicators, uraIndicators);
  const isDealer = hand.seatWind === WIND.east;
  const han = analysis.han + dora.total;
  const score = calcScore({
    han,
    fu: han >= 5 ? null : analysis.fu.fu,
    isDealer,
    isTsumo: hand.isTsumo,
  });
  return { analysis, dora, isDealer, han, score };
}
