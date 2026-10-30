import { describe, expect, it } from 'vitest';
import { countKinds, parseTiles } from '@/features/tiles/tile';
import { decompose } from './decompose';
import { interpretHand } from './interpret';
import { testHand } from './testHand';

describe('decompose', () => {
  it('九蓮宝燈の形は、どの萬子を足しても和了形になる', () => {
    for (let rank = 1; rank <= 9; rank++) {
      const counts = countKinds(parseTiles(`1112345678999m${rank}m`));
      expect(decompose(counts, 4).length, `${rank}m`).toBeGreaterThan(0);
    }
  });

  it('和了形でなければ空', () => {
    expect(decompose(countKinds(parseTiles('123m456p789s1234z')), 4)).toEqual(
      []
    );
  });

  it('七対子と一般形の両方に分けられる形（二盃口形）は両方を返す', () => {
    const forms = decompose(countKinds(parseTiles('112233m445566p77s')), 4).map(
      (d) => d.form
    );
    expect(forms).toContain('chiitoi');
    expect(forms).toContain('standard');
  });

  it('同じ牌4枚は七対子の2組にしない', () => {
    const forms = decompose(countKinds(parseTiles('1111m22334455p66s')), 4).map(
      (d) => d.form
    );
    expect(forms).not.toContain('chiitoi');
  });
});

describe('interpretHand', () => {
  it('両面待ち', () => {
    const its = interpretHand(testHand('234m567p234s56s88m', '7s'));
    expect(its.map((i) => i.wait)).toEqual(['ryanmen']);
  });

  it.each([
    ['嵌張', '234m567p234s46s88m', '5s', 'kanchan'],
    ['辺張（12 の 3 待ち）', '234m567p789s12s88m', '3s', 'penchan'],
    ['辺張（89 の 7 待ち）', '234m567p234s89s88m', '7s', 'penchan'],
    ['単騎', '234m567p234s678s8m', '8m', 'tanki'],
    ['双碰', '234m567p789s55p88m', '8m', 'shanpon'],
  ])('%s', (_, concealed, win, wait) => {
    expect(interpretHand(testHand(concealed, win)).map((i) => i.wait)).toEqual([
      wait,
    ]);
  });

  it('1233 に 3 を足すと、単騎と辺張の2通りに解釈できる', () => {
    const waits = interpretHand(testHand('1233m567p345s789s', '3m')).map(
      (i) => i.wait
    );
    expect(waits.sort()).toEqual(['penchan', 'tanki']);
  });

  it('副露があると、手の中の面子の数が減る', () => {
    const hand = testHand('567p234s56s88m', '7s', { melds: [['chi', '234m']] });
    expect(interpretHand(hand)).toHaveLength(1);
  });
});
