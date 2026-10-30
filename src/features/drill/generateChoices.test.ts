import { describe, expect, it } from 'vitest';
import { CHOICE_COUNT, generateChoices } from './generateChoices';
import { listCandidates } from './generateQuestion';
import { formatPayment } from './payment';
import { seededRng } from './testRng';

describe('generateChoices', () => {
  const all = listCandidates({ seat: 'both', win: 'both', range: 'all' });

  it('どの問題でも、正解をちょうど1つ含む重複のない4択になる', () => {
    const rng = seededRng(7);
    for (const q of all) {
      const keys = generateChoices(q, rng).map(formatPayment);
      expect(keys).toHaveLength(CHOICE_COUNT);
      expect(new Set(keys).size).toBe(CHOICE_COUNT);
      expect(keys.filter((k) => k === formatPayment(q.answer))).toHaveLength(1);
    }
  });

  it('誤答は正解と同じ形式（ロン/子ツモ/親ツモ）になる', () => {
    const rng = seededRng(3);
    for (const q of all) {
      for (const choice of generateChoices(q, rng)) {
        expect(choice.kind).toBe(q.answer.kind);
      }
    }
  });
});
