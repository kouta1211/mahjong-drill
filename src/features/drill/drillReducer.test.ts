import { describe, expect, it } from 'vitest';
import {
  drillReducer,
  initialDrillState,
  type DrillState,
} from './drillReducer';
import { generateQuestions } from './generateQuestion';
import { seededRng } from './testRng';
import { DEFAULT_SETTINGS } from './types';

function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('テスト用の問題が作れませんでした');
  return value;
}

const questions = generateQuestions(
  { ...DEFAULT_SETTINGS, count: 5 },
  seededRng(1)
).slice(0, 2);
const choices = questions.map(() => []);
const q1 = must(questions[0]);
const q2 = must(questions[1]);

const wrongOf = (total: number) =>
  ({ kind: 'ron', total: total + 100 }) as const;

function play(): DrillState {
  let s = drillReducer(initialDrillState, {
    type: 'start',
    questions,
    choices,
  });
  s = drillReducer(s, { type: 'answer', given: q1.answer });
  s = drillReducer(s, { type: 'next' });
  s = drillReducer(s, { type: 'answer', given: wrongOf(99999) });
  return drillReducer(s, { type: 'next' });
}

describe('drillReducer', () => {
  it('設定 → 出題 → 結果 まで進み、正誤を記録する', () => {
    const result = play();
    expect(result.phase).toBe('result');
    if (result.phase !== 'result') return;
    expect(result.history.map((h) => h.correct)).toEqual([true, false]);
    expect(result.history[1]?.question).toEqual(q2);
  });

  it('回答前に「次へ」は効かない', () => {
    const s = drillReducer(initialDrillState, {
      type: 'start',
      questions,
      choices,
    });
    expect(drillReducer(s, { type: 'next' })).toBe(s);
  });

  it('同じ問題に2回は答えられない', () => {
    let s = drillReducer(initialDrillState, {
      type: 'start',
      questions,
      choices,
    });
    s = drillReducer(s, { type: 'answer', given: q1.answer });
    expect(drillReducer(s, { type: 'answer', given: q1.answer })).toBe(s);
  });

  it('選択肢の数が問題と合わなければ開始しない', () => {
    expect(
      drillReducer(initialDrillState, {
        type: 'start',
        questions,
        choices: [],
      })
    ).toBe(initialDrillState);
  });

  it('問題が0問なら開始しない', () => {
    expect(
      drillReducer(initialDrillState, {
        type: 'start',
        questions: [],
        choices: [],
      })
    ).toBe(initialDrillState);
  });

  it('出題中は設定を変えられない', () => {
    const s = drillReducer(initialDrillState, {
      type: 'start',
      questions,
      choices,
    });
    expect(
      drillReducer(s, {
        type: 'updateSettings',
        settings: { ...DEFAULT_SETTINGS, count: 20 },
      })
    ).toBe(s);
  });

  it('もう一度で、設定を保ったまま設定画面に戻る', () => {
    const settings = { ...DEFAULT_SETTINGS, count: 5 as const };
    let s = drillReducer(initialDrillState, {
      type: 'updateSettings',
      settings,
    });
    s = drillReducer(s, { type: 'start', questions, choices });
    s = drillReducer(s, { type: 'restart' });
    expect(s).toEqual({ phase: 'setup', settings });
  });
});
