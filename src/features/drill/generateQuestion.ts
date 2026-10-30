import { calcScore } from '@/features/score/calcScore';
import { listPossibleCombos } from '@/features/score/validCombos';
import type { DrillSettings, Question, Rng } from './types';

type Filters = Pick<DrillSettings, 'seat' | 'win' | 'range'>;

/** 絞り込み条件に合う問題をすべて列挙する */
export function listCandidates({ seat, win, range }: Filters): Question[] {
  const dealerOptions = seat === 'both' ? [false, true] : [seat === 'dealer'];
  const candidates: Question[] = [];
  for (const combo of listPossibleCombos()) {
    if (win === 'tsumo' && !combo.isTsumo) continue;
    if (win === 'ron' && combo.isTsumo) continue;
    for (const isDealer of dealerOptions) {
      const { limit, payment } = calcScore({ ...combo, isDealer });
      if (range === 'belowMangan' && limit !== null) continue;
      candidates.push({ ...combo, isDealer, answer: payment });
    }
  }
  return candidates;
}

function pick<T>(items: readonly T[], rng: Rng): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('候補が空です');
  return item;
}

const isSameQuestion = (a: Question, b: Question) =>
  a.han === b.han &&
  a.fu === b.fu &&
  a.isDealer === b.isDealer &&
  a.isTsumo === b.isTsumo;

/** 設定の出題数だけ問題を作る。直前と同じ問題は続けない */
export function generateQuestions(
  settings: DrillSettings,
  rng: Rng
): Question[] {
  const candidates = listCandidates(settings);
  if (candidates.length === 0) {
    throw new Error('条件に合う問題がありません');
  }
  const questions: Question[] = [];
  while (questions.length < settings.count) {
    const prev = questions.at(-1);
    const pool =
      prev && candidates.length > 1
        ? candidates.filter((c) => !isSameQuestion(c, prev))
        : candidates;
    questions.push(pick(pool, rng));
  }
  return questions;
}
