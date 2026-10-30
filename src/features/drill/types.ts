import type { Payment } from '@/features/score/calcScore';

export type SeatFilter = 'dealer' | 'nonDealer' | 'both';
export type WinFilter = 'tsumo' | 'ron' | 'both';
export type RangeFilter = 'belowMangan' | 'all';
export type AnswerMode = 'choice' | 'number';
export type Level = 1 | 2;
export type MeldFilter = 'closedOnly' | 'any';

export const QUESTION_COUNTS = [5, 10, 20] as const;
export type QuestionCount = (typeof QUESTION_COUNTS)[number];

export type DrillSettings = {
  level: Level;
  count: QuestionCount;
  seat: SeatFilter;
  win: WinFilter;
  range: RangeFilter;
  answerMode: AnswerMode;
  showExplanation: boolean;
  /** Lv2 のみ */
  melds: MeldFilter;
  /** Lv2 のみ */
  includeChiitoi: boolean;
};

export const DEFAULT_SETTINGS: DrillSettings = {
  level: 1,
  count: 10,
  seat: 'both',
  win: 'both',
  range: 'belowMangan',
  answerMode: 'choice',
  showExplanation: true,
  melds: 'any',
  includeChiitoi: true,
};

export type Question = {
  han: number;
  fu: number | null;
  isDealer: boolean;
  isTsumo: boolean;
  answer: Payment;
};

export type { Rng } from '@/lib/rng';
