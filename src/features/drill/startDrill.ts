import { generateChoices } from './generateChoices';
import { generateQuestions } from './generateQuestion';
import type { DrillAction } from './drillReducer';
import type { DrillSettings, Rng } from './types';

/** 開始ボタンで呼ぶ。乱数を使うので、描画中ではなくイベントの中で呼ぶこと */
export function createStartAction(
  settings: DrillSettings,
  rng: Rng
): Extract<DrillAction, { type: 'start' }> {
  const questions = generateQuestions(settings, rng);
  return {
    type: 'start',
    questions,
    choices: questions.map((q) => generateChoices(q, rng)),
  };
}
