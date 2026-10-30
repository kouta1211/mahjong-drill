import type { Payment } from '@/features/score/calcScore';
import { listCandidates } from './generateQuestion';
import { formatPayment, totalOf } from './payment';
import type { Question, Rng } from './types';
import { shuffle } from '@/lib/random';

export const CHOICE_COUNT = 4;
/** 誤答は、正解に点数が近いこの数の中から選ぶ */
const NEAR_POOL_SIZE = 6;

/**
 * 正解を含む4つの選択肢を作る。
 * 誤答は「同じ親子・ツモロンで、点数が近い別の答え」から選ぶので、
 * 形式（オール表記など）だけで正解が分かることはない。
 */
export function generateChoices(question: Question, rng: Rng): Payment[] {
  const answerKey = formatPayment(question.answer);
  const answerTotal = totalOf(question.answer);

  const distinct = new Map<string, Payment>();
  for (const c of listCandidates({
    seat: question.isDealer ? 'dealer' : 'nonDealer',
    win: question.isTsumo ? 'tsumo' : 'ron',
    range: 'all',
  })) {
    const key = formatPayment(c.answer);
    if (key !== answerKey) distinct.set(key, c.answer);
  }

  const near = [...distinct.values()]
    .sort(
      (a, b) =>
        Math.abs(totalOf(a) - answerTotal) - Math.abs(totalOf(b) - answerTotal)
    )
    .slice(0, NEAR_POOL_SIZE);
  const wrong = shuffle(near, rng).slice(0, CHOICE_COUNT - 1);
  return shuffle([question.answer, ...wrong], rng);
}
