import type { Payment } from '@/features/score/calcScore';
import { isSamePayment } from './payment';
import { DEFAULT_SETTINGS, type DrillSettings, type Question } from './types';

export type AnsweredQuestion = {
  question: Question;
  given: Payment;
  correct: boolean;
};

export type DrillState =
  | { phase: 'setup'; settings: DrillSettings }
  | {
      phase: 'playing';
      settings: DrillSettings;
      questions: Question[];
      /** questions と同じ並び。4択でないときも作っておく */
      choices: Payment[][];
      index: number;
      history: AnsweredQuestion[];
      /** 回答済みで「次へ」を待っているとき、その回答 */
      current: AnsweredQuestion | null;
    }
  | { phase: 'result'; settings: DrillSettings; history: AnsweredQuestion[] };

export type DrillAction =
  | { type: 'updateSettings'; settings: DrillSettings }
  | { type: 'start'; questions: Question[]; choices: Payment[][] }
  | { type: 'answer'; given: Payment }
  | { type: 'next' }
  | { type: 'restart' };

export const initialDrillState: DrillState = {
  phase: 'setup',
  settings: DEFAULT_SETTINGS,
};

/** 想定外の順番で届いたアクションは無視して、状態を変えない */
export function drillReducer(
  state: DrillState,
  action: DrillAction
): DrillState {
  switch (action.type) {
    case 'updateSettings':
      return state.phase === 'setup'
        ? { ...state, settings: action.settings }
        : state;

    case 'start':
      if (
        state.phase !== 'setup' ||
        action.questions.length === 0 ||
        action.choices.length !== action.questions.length
      ) {
        return state;
      }
      return {
        phase: 'playing',
        settings: state.settings,
        questions: action.questions,
        choices: action.choices,
        index: 0,
        history: [],
        current: null,
      };

    case 'answer': {
      if (state.phase !== 'playing' || state.current !== null) return state;
      const question = state.questions[state.index];
      if (!question) return state;
      const answered: AnsweredQuestion = {
        question,
        given: action.given,
        correct: isSamePayment(question.answer, action.given),
      };
      return {
        ...state,
        current: answered,
        history: [...state.history, answered],
      };
    }

    case 'next': {
      if (state.phase !== 'playing' || state.current === null) return state;
      const nextIndex = state.index + 1;
      if (nextIndex >= state.questions.length) {
        return {
          phase: 'result',
          settings: state.settings,
          history: state.history,
        };
      }
      return { ...state, index: nextIndex, current: null };
    }

    case 'restart':
      return { phase: 'setup', settings: state.settings };
  }
}
