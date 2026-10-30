import { describe, expect, it } from 'vitest';
import { generateYakuHand } from '@/features/generate/yakuHand';
import { isMenzen } from '@/features/hand/types';
import { seededRng } from '@/lib/testRng';
import {
  formatYaku,
  generateYakuChoices,
  isSameYaku,
  toYakuAnswer,
} from './yakuAnswer';

describe('toYakuAnswer / formatYaku / isSameYaku', () => {
  it('門前かどうかで翻数が変わり、副露で付かない役は無視する', () => {
    expect(toYakuAnswer(['honitsu', 'ittsu'], true)).toEqual({
      ids: ['honitsu', 'ittsu'],
      han: 5,
    });
    expect(toYakuAnswer(['honitsu', 'ittsu', 'pinfu'], false)).toEqual({
      ids: ['honitsu', 'ittsu'],
      han: 3,
    });
  });

  it('表示は役の一覧の順（並べた順に関係しない）', () => {
    expect(formatYaku(toYakuAnswer(['tanyao', 'riichi'], true))).toBe(
      '立直・断么九（2翻）'
    );
  });

  it('役の組み合わせが同じなら同じ答え（並び順は問わない）', () => {
    expect(
      isSameYaku(
        toYakuAnswer(['tanyao', 'riichi'], true),
        toYakuAnswer(['riichi', 'tanyao'], true)
      )
    ).toBe(true);
  });
});

describe('generateYakuChoices', () => {
  it('生成した手のどれでも、正解を1つ含む重複のない4択になる', () => {
    const rng = seededRng(21);
    const filters = {
      melds: 'any',
      win: 'both',
      includeChiitoi: true,
    } as const;
    for (let i = 0; i < 200; i++) {
      const { hand, analysis } = generateYakuHand(filters, rng);
      const answer = toYakuAnswer(
        analysis.yaku.map((y) => y.id),
        isMenzen(hand)
      );
      const choices = generateYakuChoices(answer, isMenzen(hand), rng);
      expect(choices).toHaveLength(4);
      expect(new Set(choices.map(formatYaku)).size).toBe(4);
      expect(choices.filter((c) => isSameYaku(c, answer))).toHaveLength(1);
    }
  });

  it('解析の翻数と、答えの翻数が一致する', () => {
    const rng = seededRng(22);
    const filters = {
      melds: 'any',
      win: 'both',
      includeChiitoi: true,
    } as const;
    for (let i = 0; i < 200; i++) {
      const { hand, analysis } = generateYakuHand(filters, rng);
      expect(
        toYakuAnswer(
          analysis.yaku.map((y) => y.id),
          isMenzen(hand)
        ).han
      ).toBe(analysis.han);
    }
  });
});
