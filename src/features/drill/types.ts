import type { Payment } from '@/features/score/calcScore';

export type SeatFilter = 'dealer' | 'nonDealer' | 'both';
export type WinFilter = 'tsumo' | 'ron' | 'both';
export type RangeFilter = 'belowMangan' | 'all';
export type AnswerMode = 'choice' | 'number';

export const QUESTION_COUNTS = [5, 10, 20] as const;
export type QuestionCount = (typeof QUESTION_COUNTS)[number];

export type DrillSettings = {
  count: QuestionCount;
  seat: SeatFilter;
  win: WinFilter;
  range: RangeFilter;
  answerMode: AnswerMode;
  showExplanation: boolean;
};

export const DEFAULT_SETTINGS: DrillSettings = {
  count: 10,
  seat: 'both',
  win: 'both',
  range: 'belowMangan',
  answerMode: 'choice',
  showExplanation: true,
};

export type Question = {
  han: number;
  fu: number | null;
  isDealer: boolean;
  isTsumo: boolean;
  answer: Payment;
};

/** 0 以上 1 未満を返す乱数。テストでは固定列を渡す */
export type Rng = () => number;
