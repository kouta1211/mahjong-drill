import { describe, expect, it } from 'vitest';
import { calcScore } from '@/features/score/calcScore';
import { addHonba } from '@/features/score/honba';
import { seededRng } from '@/lib/testRng';
import { explain } from './explain';
import { generateChoices } from './generateChoices';
import { generateQuestions } from './generateQuestion';
import { formatPayment, isSamePayment } from './payment';
import { DEFAULT_SETTINGS, MAX_HONBA, type Question } from './types';

describe('本場ありの出題（Lv1）', () => {
  const questions = generateQuestions(
    { ...DEFAULT_SETTINGS, count: 20, honba: true, range: 'all' },
    seededRng(41)
  );

  it('本場は 0〜MAX_HONBA で、答えは「本場なしの点数 ＋ 本場」', () => {
    for (const q of questions) {
      const honba = q.honba ?? 0;
      expect(honba).toBeGreaterThanOrEqual(0);
      expect(honba).toBeLessThanOrEqual(MAX_HONBA);
      expect(q.answer).toEqual(addHonba(calcScore(q).payment, honba));
    }
    expect(questions.some((q) => (q.honba ?? 0) > 0)).toBe(true);
  });

  it('本場があれば「本場を足し忘れた点数」が誤答に入る。正解は1つで重複しない', () => {
    const rng = seededRng(42);
    for (const q of questions) {
      const choices = generateChoices(q, rng);
      expect(choices).toHaveLength(4);
      expect(new Set(choices.map(formatPayment)).size).toBe(4);
      expect(choices.filter((c) => isSamePayment(c, q.answer))).toHaveLength(1);
      if ((q.honba ?? 0) > 0) {
        const forgot = calcScore(q).payment;
        expect(choices.some((c) => isSamePayment(c, forgot))).toBe(true);
      }
    }
  });

  it('本場なしの設定では、本場は付かない', () => {
    const plain = generateQuestions(
      { ...DEFAULT_SETTINGS, count: 10 },
      seededRng(43)
    );
    expect(plain.every((q) => q.honba === undefined)).toBe(true);
  });
});

describe('explain（本場）', () => {
  it('最後に本場の加算を書く', () => {
    // 子 30符4翻 ツモ（切り上げ満貫 2000-4000）の 2本場 → 2200-4200
    const base = { han: 4, fu: 30, isDealer: false, isTsumo: true };
    const q: Question = {
      ...base,
      honba: 2,
      answer: addHonba(calcScore(base).payment, 2),
    };
    expect(explain(q).at(-1)).toBe(
      '2本場: 支払う人それぞれに +200 → 2200-4200'
    );
  });
});
