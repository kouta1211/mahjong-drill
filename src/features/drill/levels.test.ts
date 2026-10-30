import { describe, expect, it } from 'vitest';
import { seededRng } from '@/lib/testRng';
import {
  createLv1Rounds,
  createLv2Rounds,
  generateFuChoices,
  parseFu,
} from './levels';
import { DEFAULT_SETTINGS } from './types';

describe('createLv1Rounds / createLv2Rounds', () => {
  it('出題数どおりに作り、正解が選択肢に1つだけ入る', () => {
    const lv1 = createLv1Rounds(
      { ...DEFAULT_SETTINGS, count: 5 },
      seededRng(1)
    );
    const lv2 = createLv2Rounds(
      { ...DEFAULT_SETTINGS, level: 2, count: 5 },
      seededRng(1)
    );
    expect(lv1).toHaveLength(5);
    expect(lv2).toHaveLength(5);
    for (const r of lv2) {
      expect(r.choices.filter((c) => c === r.answer)).toHaveLength(1);
      expect(r.answer).toBe(r.question.analysis.result.fu);
    }
  });

  it('Lv2 の絞り込み（門前のみ・ロンのみ）が効く', () => {
    const rounds = createLv2Rounds(
      {
        ...DEFAULT_SETTINGS,
        level: 2,
        count: 20,
        melds: 'closedOnly',
        win: 'ron',
      },
      seededRng(2)
    );
    for (const { question } of rounds) {
      expect(question.hand.melds.every((m) => m.type === 'ankan')).toBe(true);
      expect(question.hand.isTsumo).toBe(false);
    }
  });
});

describe('generateFuChoices', () => {
  it.each([20, 25, 30, 70, 110, 130])(
    '%i符: 重複のない4択で正解を含む',
    (answer) => {
      const choices = generateFuChoices(answer, seededRng(answer));
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(answer);
    }
  );
});

describe('parseFu', () => {
  it.each([
    ['30', 30],
    ['２５', 25],
    [' 110 ', 110],
  ])('%s → %i', (raw, value) => {
    expect(parseFu(raw)).toEqual({ ok: true, value });
  });

  it.each([
    ['', '符を入力してください'],
    ['3a', '数字だけで入力してください'],
    ['10', '20符以上で入力してください'],
    ['32', '10符単位で入力してください（七対子は25符）'],
  ])('%s はエラー「%s」', (raw, error) => {
    expect(parseFu(raw)).toEqual({ ok: false, error });
  });
});
