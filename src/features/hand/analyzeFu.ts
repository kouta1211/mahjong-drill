import { calcFu, type FuResult } from './calcFu';
import { interpretHand } from './interpret';
import type { WinningHand } from './types';

export type FuAnalysis =
  | { ok: true; result: FuResult }
  | {
      ok: false;
      reason: 'notWinning' | 'ambiguousFu' | 'shanponRon';
    };

/**
 * Lv2 の出題に使えるかを判定し、使えるなら符を返す。
 * - 解釈によって符が変わる手は使わない（高点法に正解を左右させない）
 * - 双碰のロンは使わない（ロンで完成した刻子の扱いを公式で確かめられていないため。
 *   docs/requirements.md 6章）
 */
export function analyzeFu(hand: WinningHand): FuAnalysis {
  const interpretations = interpretHand(hand);
  const [first] = interpretations;
  if (!first) return { ok: false, reason: 'notWinning' };
  if (!hand.isTsumo && interpretations.some((it) => it.wait === 'shanpon')) {
    return { ok: false, reason: 'shanponRon' };
  }
  const results = interpretations.map((it) => calcFu(hand, it));
  if (results.some((r) => r.fu !== results[0]?.fu)) {
    return { ok: false, reason: 'ambiguousFu' };
  }
  return { ok: true, result: calcFu(hand, first) };
}
