import { describe, expect, it } from 'vitest';
import { calcScore } from '@/features/score/calcScore';
import { countKinds, WIND } from '@/features/tiles/tile';
import { seededRng } from '@/lib/testRng';
import { testHand } from '@/features/hand/testHand';
import { parseTiles } from '@/features/tiles/tile';
import { analyzeHand } from '@/features/yaku/analyzeHand';
import { generateScoreHand, scoreHand, type SeatFilter } from './scoreHand';

const SAMPLES = 300;

function generateMany(seat: SeatFilter, seed: number) {
  const rng = seededRng(seed);
  const filters = {
    melds: 'any',
    win: 'both',
    includeChiitoi: true,
    seat,
  } as const;
  return Array.from({ length: SAMPLES }, () => generateScoreHand(filters, rng));
}

describe('generateScoreHand', () => {
  const hands = generateMany('both', 31);

  it('手牌と表示牌を合わせても、同じ牌は4枚まで', () => {
    for (const { hand, indicators, uraIndicators } of hands) {
      const all = [
        ...hand.concealed,
        hand.winTile,
        ...hand.melds.flatMap((m) => m.tiles),
        ...indicators,
        ...uraIndicators,
      ];
      expect(Math.max(...countKinds(all))).toBeLessThanOrEqual(4);
    }
  });

  it('表示牌は 1 ＋ 槓の数。裏ドラ表示牌は立直のときだけ同じ枚数', () => {
    for (const { hand, indicators, uraIndicators } of hands) {
      const quads = hand.melds.filter((m) => m.tiles.length === 4).length;
      expect(indicators).toHaveLength(1 + quads);
      expect(uraIndicators).toHaveLength(hand.riichi ? 1 + quads : 0);
    }
  });

  it('点数は「役の翻 ＋ ドラの翻」と符・親子から計算したもの', () => {
    for (const g of hands) {
      expect(g.han).toBe(g.analysis.han + g.dora.total);
      expect(g.isDealer).toBe(g.hand.seatWind === WIND.east);
      const expected = calcScore({
        han: g.han,
        fu: g.han >= 5 ? null : g.analysis.fu.fu,
        isDealer: g.isDealer,
        isTsumo: g.hand.isTsumo,
      });
      expect(g.score).toEqual(expected);
    }
  });

  it('ドラのある手も、満貫以上の手も出る', () => {
    expect(hands.some((h) => h.dora.total > 0)).toBe(true);
    expect(hands.some((h) => h.score.limit !== null)).toBe(true);
    expect(hands.some((h) => h.score.limit === null)).toBe(true);
  });

  it.each([
    ['dealer', true],
    ['nonDealer', false],
  ] as const)('親・子の絞り込み（%s）が効く', (seat, isDealer) => {
    for (const h of generateMany(seat, 32).slice(0, 50)) {
      expect(h.isDealer).toBe(isDealer);
    }
  });
});

describe('scoreHand（手計算した点数と照合）', () => {
  // 子・ロン・立直。234m 567p 234s 56s 88m に 7s。立直・平和・断么九の 3翻30符
  function score(concealed: string, indicators: string, ura: string) {
    const hand = testHand(concealed, '7s', {
      riichi: true,
      seatWind: WIND.south,
    });
    const analysis = analyzeHand(hand);
    if (!analysis.ok) throw new Error(analysis.reason);
    return scoreHand(hand, analysis, parseTiles(indicators), parseTiles(ura));
  }

  it('ドラなしは 3翻30符で 3900（公式の早見表の値）', () => {
    expect(score('234m567p234s56s88m', '9p', '9p').score.payment).toEqual({
      kind: 'ron',
      total: 3900,
    });
  });

  it('表ドラ1枚で 4翻30符、切り上げ満貫の 8000', () => {
    // 表示牌 1s → 2s が1枚
    const result = score('234m567p234s56s88m', '1s', '9p');
    expect(result.han).toBe(4);
    expect(result.score.payment).toEqual({ kind: 'ron', total: 8000 });
  });

  it('表ドラ2・裏ドラ1・赤1 で 7翻、跳満の 12000', () => {
    // 表示牌 7m → 8m が2枚、裏ドラ表示牌 1s → 2s が1枚、赤5s が1枚
    const result = score('234m567p234s0s6s88m', '7m', '1s');
    expect(result.dora).toEqual({ dora: 2, ura: 1, red: 1, total: 4 });
    expect(result.han).toBe(7);
    expect(result.score.payment).toEqual({ kind: 'ron', total: 12000 });
  });
});
