import { describe, expect, it } from 'vitest';
import { seededRng } from '@/lib/testRng';
import { countKinds, DRAGONS, isSimple } from '@/features/tiles/tile';
import { analyzeFu } from './analyzeFu';
import { generateFuHand, type HandFilters } from './generateHand';
import { interpretHand } from './interpret';
import { isMenzen } from './types';

const SAMPLES = 300;

function generateMany(filters: HandFilters, seed: number) {
  const rng = seededRng(seed);
  return Array.from({ length: SAMPLES }, () => generateFuHand(filters, rng));
}

describe('generateFuHand', () => {
  const any: HandFilters = { melds: 'any', win: 'both', includeChiitoi: true };
  const hands = generateMany(any, 1);

  it('どの手も14枚（槓子は1枚多い）で、同じ牌は4枚まで', () => {
    for (const { hand } of hands) {
      const all = [
        ...hand.concealed,
        hand.winTile,
        ...hand.melds.flatMap((m) => m.tiles),
      ];
      const quads = hand.melds.filter(
        (m) => m.type === 'minkan' || m.type === 'ankan'
      ).length;
      expect(all).toHaveLength(14 + quads);
      expect(Math.max(...countKinds(all))).toBeLessThanOrEqual(4);
      expect(all.filter((t) => t.red).length).toBeLessThanOrEqual(3);
    }
  });

  it('どの手も和了形で、解釈によって符が変わらない', () => {
    for (const { hand, analysis } of hands) {
      expect(interpretHand(hand).length).toBeGreaterThan(0);
      expect(analyzeFu(hand)).toEqual(analysis);
    }
  });

  it('双碰のロンは出さない', () => {
    for (const { hand } of hands) {
      if (hand.isTsumo) continue;
      expect(interpretHand(hand).some((it) => it.wait === 'shanpon')).toBe(
        false
      );
    }
  });

  it('門前の手はリーチ付き。副露した手は役牌の刻子か断么九', () => {
    for (const { hand } of hands) {
      if (isMenzen(hand)) {
        expect(hand.riichi).toBe(true);
        continue;
      }
      const all = [
        ...hand.concealed,
        hand.winTile,
        ...hand.melds.flatMap((m) => m.tiles),
      ];
      const tanyao = all.every((t) => isSimple(t.kind));
      const counts = countKinds([...hand.concealed, hand.winTile]);
      const valueKinds: number[] = [...DRAGONS, hand.seatWind, hand.roundWind];
      const valueTriplet =
        hand.melds.some(
          (m) => m.type !== 'chi' && valueKinds.includes(m.tiles[0]?.kind ?? -1)
        ) || valueKinds.some((k) => (counts[k] ?? 0) >= 3);
      expect(tanyao || valueTriplet).toBe(true);
    }
  });

  it('いろいろな符・形が出る（偏りすぎていない）', () => {
    const fus = new Set(hands.map((h) => h.analysis.result.fu));
    expect(fus.size).toBeGreaterThanOrEqual(5);
    expect(hands.some((h) => h.hand.melds.length > 0)).toBe(true);
    expect(hands.some((h) => h.analysis.result.fu === 25)).toBe(true);
  });

  it('門前のみ・ツモのみの絞り込みが効く', () => {
    for (const { hand } of generateMany(
      { melds: 'closedOnly', win: 'tsumo', includeChiitoi: false },
      2
    )) {
      expect(isMenzen(hand)).toBe(true);
      expect(hand.isTsumo).toBe(true);
    }
  });

  it('七対子を含めない設定では 25符が出ない', () => {
    const list = generateMany({ ...any, includeChiitoi: false }, 3);
    expect(list.some((h) => h.analysis.result.fu === 25)).toBe(false);
  });
});
