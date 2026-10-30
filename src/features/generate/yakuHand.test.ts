import { describe, expect, it } from 'vitest';
import { analyzeHand } from '@/features/yaku/analyzeHand';
import type { YakuId } from '@/features/yaku/yakuList';
import { seededRng } from '@/lib/testRng';
import type { HandFilters } from './buildHand';
import { generateYakuHand } from './yakuHand';

const SAMPLES = 400;

describe('generateYakuHand', () => {
  const filters: HandFilters = {
    melds: 'any',
    win: 'both',
    includeChiitoi: true,
  };
  const rng = seededRng(11);
  const hands = Array.from({ length: SAMPLES }, () =>
    generateYakuHand(filters, rng)
  );

  it('どの手も出題に使え（役がある・役満でない・役が1つに決まる）、解析し直しても同じ結果', () => {
    for (const { hand, analysis } of hands) {
      expect(analyzeHand(hand)).toEqual(analysis);
      expect(analysis.han).toBeGreaterThan(0);
    }
  });

  it('赤5は混ぜない（Lv3 はドラを扱わない）', () => {
    for (const { hand } of hands) {
      const all = [
        hand.winTile,
        ...hand.concealed,
        ...hand.melds.flatMap((m) => m.tiles),
      ];
      expect(all.some((t) => t.red)).toBe(false);
    }
  });

  it('狙った役が、それなりの割合で出る', () => {
    const seen = new Map<YakuId, number>();
    for (const { analysis } of hands) {
      for (const y of analysis.yaku) seen.set(y.id, (seen.get(y.id) ?? 0) + 1);
    }
    const targets: YakuId[] = [
      'honitsu',
      'chinitsu',
      'toitoi',
      'chanta',
      'sanshoku',
      'ittsu',
      'iipeikou',
      'chiitoitsu',
      'tanyao',
    ];
    for (const id of targets) {
      expect(seen.get(id) ?? 0, id).toBeGreaterThanOrEqual(SAMPLES * 0.02);
    }
  });

  it('リーチだけの手ばかりにならない', () => {
    const riichiOnly = hands.filter(
      ({ analysis }) =>
        analysis.yaku.length === 1 && analysis.yaku[0]?.id === 'riichi'
    ).length;
    expect(riichiOnly).toBeLessThan(SAMPLES * 0.25);
  });
});
