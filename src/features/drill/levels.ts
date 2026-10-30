import type { Payment } from '@/features/score/calcScore';
import { CHIITOI_FU } from '@/features/hand/calcFu';
import {
  generateFuHand,
  type GeneratedHand,
} from '@/features/hand/generateHand';
import { generateChoices } from './generateChoices';
import { generateQuestions } from './generateQuestion';
import { normalizeNumberInput, type ParseResult } from '@/lib/parseNumber';
import type { Round } from './session';
import type { DrillSettings, Question, Rng } from './types';

export type Lv1Round = Round<Question, Payment>;
export type Lv2Round = Round<GeneratedHand, number>;

/** Lv1（早見表）の問題を作る。乱数を使うので、描画中ではなくイベントの中で呼ぶこと */
export function createLv1Rounds(settings: DrillSettings, rng: Rng): Lv1Round[] {
  return generateQuestions(settings, rng).map((question) => ({
    question,
    answer: question.answer,
    choices: generateChoices(question, rng),
  }));
}

/** 4択の誤答は、正解に近いこの数の符から選ぶ */
const NEAR_FU_COUNT = 5;
const MIN_FU = 20;
const MAX_CHOICE_FU = 140;

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = result[i];
    const b = result[j];
    if (a === undefined || b === undefined) continue;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

/** 符の4択。誤答は正解に近い符から選ぶ */
export function generateFuChoices(answer: number, rng: Rng): number[] {
  const all = [CHIITOI_FU];
  for (let fu = MIN_FU; fu <= Math.max(MAX_CHOICE_FU, answer); fu += 10)
    all.push(fu);
  const near = all
    .filter((fu) => fu !== answer)
    .sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer))
    .slice(0, NEAR_FU_COUNT);
  return shuffle([answer, ...shuffle(near, rng).slice(0, 3)], rng);
}

/** Lv2（符計算）の問題を作る。乱数を使うので、描画中ではなくイベントの中で呼ぶこと */
export function createLv2Rounds(settings: DrillSettings, rng: Rng): Lv2Round[] {
  const filters = {
    melds: settings.melds,
    win: settings.win,
    includeChiitoi: settings.includeChiitoi,
  };
  return Array.from({ length: settings.count }, () => {
    const generated = generateFuHand(filters, rng);
    const answer = generated.analysis.result.fu;
    return {
      question: generated,
      answer,
      choices: generateFuChoices(answer, rng),
    };
  });
}

/** 数値入力欄の文字列を符として読む。全角数字も受け付ける */
export function parseFu(raw: string): ParseResult {
  const normalized = normalizeNumberInput(raw);
  if (normalized === '') return { ok: false, error: '符を入力してください' };
  if (!/^\d+$/.test(normalized))
    return { ok: false, error: '数字だけで入力してください' };
  const value = Number(normalized);
  if (value < MIN_FU)
    return { ok: false, error: `${MIN_FU}符以上で入力してください` };
  if (value !== CHIITOI_FU && value % 10 !== 0) {
    return { ok: false, error: '10符単位で入力してください（七対子は25符）' };
  }
  return { ok: true, value };
}
