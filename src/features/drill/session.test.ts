import { describe, expect, it } from 'vitest';
import { createSessionReducer, startSession, type Round } from './session';

const rounds: Round<string, number>[] = [
  { question: 'q1', answer: 30, choices: [20, 30, 40, 50] },
  { question: 'q2', answer: 40, choices: [30, 40, 50, 60] },
];
const reducer = createSessionReducer<string, number>((a, b) => a === b);

describe('session', () => {
  it('出題 → 回答 → 結果 まで進み、正誤を記録する', () => {
    let s = startSession(rounds);
    s = reducer(s, { type: 'answer', given: 30 });
    s = reducer(s, { type: 'next' });
    s = reducer(s, { type: 'answer', given: 50 });
    s = reducer(s, { type: 'next' });
    expect(s.phase).toBe('result');
    expect(s.history.map((h) => h.correct)).toEqual([true, false]);
    expect(s.history[1]?.round.question).toBe('q2');
  });

  it('回答前に「次へ」は効かない', () => {
    const s = startSession(rounds);
    expect(reducer(s, { type: 'next' })).toBe(s);
  });

  it('同じ問題に2回は答えられない', () => {
    const s = reducer(startSession(rounds), { type: 'answer', given: 30 });
    expect(reducer(s, { type: 'answer', given: 20 })).toBe(s);
  });

  it('結果画面ではどのアクションも効かない', () => {
    const s = startSession(rounds.slice(0, 1));
    const done = reducer(reducer(s, { type: 'answer', given: 30 }), {
      type: 'next',
    });
    expect(done.phase).toBe('result');
    expect(reducer(done, { type: 'answer', given: 30 })).toBe(done);
  });

  it('問題が0問なら始められない', () => {
    expect(() => startSession([])).toThrow('問題がありません');
  });
});
