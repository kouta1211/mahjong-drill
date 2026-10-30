import { describe, expect, it } from 'vitest';
import { calcScore } from '@/features/score/calcScore';
import { generateQuestions, listCandidates } from './generateQuestion';
import { seededRng } from '@/lib/testRng';
import { DEFAULT_SETTINGS, type DrillSettings } from './types';

describe('listCandidates', () => {
  it('親・ツモ・満貫未満に絞ると、すべてその条件を満たす', () => {
    const list = listCandidates({
      seat: 'dealer',
      win: 'tsumo',
      range: 'belowMangan',
    });
    expect(list.length).toBeGreaterThan(0);
    for (const q of list) {
      expect(q.isDealer).toBe(true);
      expect(q.isTsumo).toBe(true);
      expect(calcScore(q).limit).toBeNull();
    }
  });

  it('満貫未満に絞ると、切り上げ満貫（30符4翻）は含まない', () => {
    const list = listCandidates({
      seat: 'both',
      win: 'both',
      range: 'belowMangan',
    });
    expect(list.some((q) => q.han === 4 && q.fu === 30)).toBe(false);
  });

  it('範囲を「すべて」にすると満貫以上も含む', () => {
    const list = listCandidates({ seat: 'both', win: 'both', range: 'all' });
    expect(list.some((q) => q.han >= 5)).toBe(true);
  });

  it('正解は calcScore の結果と一致する', () => {
    for (const q of listCandidates({
      seat: 'both',
      win: 'both',
      range: 'all',
    })) {
      expect(q.answer).toEqual(calcScore(q).payment);
    }
  });
});

describe('generateQuestions', () => {
  const settings: DrillSettings = { ...DEFAULT_SETTINGS, count: 20 };

  it('出題数どおりに作る', () => {
    expect(generateQuestions(settings, seededRng(1))).toHaveLength(20);
  });

  it('同じ seed なら同じ問題になる', () => {
    expect(generateQuestions(settings, seededRng(42))).toEqual(
      generateQuestions(settings, seededRng(42))
    );
  });

  it('直前と同じ問題は続かない', () => {
    // 常に0を返す rng でも、2問目は別の問題になる
    const questions = generateQuestions({ ...settings, count: 5 }, () => 0);
    for (let i = 1; i < questions.length; i++) {
      expect(questions[i]).not.toEqual(questions[i - 1]);
    }
  });
});
