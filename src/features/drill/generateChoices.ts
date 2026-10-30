import { calcScore, type Payment } from '@/features/score/calcScore';
import { addHonba } from '@/features/score/honba';
import { listCandidates } from './generateQuestion';
import { formatPayment, isSamePayment, totalOf } from './payment';
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
  const honba = question.honba ?? 0;
  if (honba > 0) return generateHonbaChoices(question, honba, rng);
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

/**
 * 本場のある問題の4択。本場を除いた問題で誤答を作って同じ本場を足し、
 * 一番起きやすい間違いの「本場を足し忘れた点数」を必ず1つ混ぜる。
 */
function generateHonbaChoices(
  question: Question,
  honba: number,
  rng: Rng
): Payment[] {
  const withoutHonba: Question = {
    ...question,
    honba: 0,
    answer: calcScore(question).payment,
  };
  const others = generateChoices(withoutHonba, rng)
    .filter((c) => !isSamePayment(c, withoutHonba.answer))
    .map((c) => addHonba(c, honba));

  const wrong = new Map<string, Payment>();
  for (const c of [withoutHonba.answer, ...others]) {
    if (!isSamePayment(c, question.answer)) wrong.set(formatPayment(c), c);
  }
  return shuffle(
    [question.answer, ...[...wrong.values()].slice(0, CHOICE_COUNT - 1)],
    rng
  );
}
