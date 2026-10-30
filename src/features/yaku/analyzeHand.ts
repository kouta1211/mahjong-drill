import { calcFu, type FuResult } from '@/features/hand/calcFu';
import { interpretHand } from '@/features/hand/interpret';
import type { Interpretation, WinningHand } from '@/features/hand/types';
import { calcScore, type Payment } from '@/features/score/calcScore';
import { isHonor, suitOf } from '@/features/tiles/tile';
import { evaluateYaku, isChuurenShape, type YakuHit } from './evaluateYaku';

export type HandAnalysis =
  | {
      ok: true;
      interpretation: Interpretation;
      yaku: YakuHit[];
      han: number;
      fu: FuResult;
    }
  | {
      ok: false;
      reason:
        | 'notWinning'
        | 'shanponRon'
        | 'unconfirmedRule'
        | 'yakuman'
        | 'noYaku'
        | 'ambiguous';
    };

/** 子の支払いの合計。解釈どうしの点数を比べるのに使う（親でも順位は変わらない） */
function pointsOf(payment: Payment): number {
  switch (payment.kind) {
    case 'ron':
      return payment.total;
    case 'tsumoNonDealer':
      return payment.fromNonDealer * 2 + payment.fromDealer;
    case 'tsumoDealer':
      return payment.all * 3;
  }
}

const yakuKey = (yaku: YakuHit[]) =>
  yaku
    .map((y) => y.id)
    .sort()
    .join(',');

/**
 * 和了手を解析する。解釈が複数あるときは、最も高い点になる解釈を採る
 * （Mリーグ公式ルール 第6章第5条）。次の手は出題に使わないので ok: false を返す。
 * - 双碰のロン: ロンで完成した刻子の扱いを公式で確かめられていない（docs/requirements.md 6章）
 * - 暗槓を含む九蓮宝燈の形: 役満になるかを公式で確かめられていない（docs/requirements.md 6章）
 * - 役満: 出題しない
 * - 最高点の解釈が複数あり、役の組み合わせが違う手: 正解が1つに決まらない
 */
export function analyzeHand(hand: WinningHand): HandAnalysis {
  const interpretations = interpretHand(hand);
  if (interpretations.length === 0) return { ok: false, reason: 'notWinning' };
  if (!hand.isTsumo && interpretations.some((it) => it.wait === 'shanpon')) {
    return { ok: false, reason: 'shanponRon' };
  }
  const kinds = [
    ...hand.concealed,
    hand.winTile,
    ...hand.melds.flatMap((m) => m.tiles),
  ].map((t) => t.kind);
  const oneSuit = new Set(kinds.map(suitOf)).size === 1 && !kinds.some(isHonor);
  if (
    hand.melds.some((m) => m.type === 'ankan') &&
    oneSuit &&
    isChuurenShape(kinds)
  ) {
    return { ok: false, reason: 'unconfirmedRule' };
  }

  const scored = [];
  for (const interpretation of interpretations) {
    const evaluation = evaluateYaku(hand, interpretation);
    if (evaluation.kind === 'yakuman') return { ok: false, reason: 'yakuman' };
    if (evaluation.han === 0) continue;
    const fu = calcFu(hand, interpretation);
    const { payment } = calcScore({
      han: evaluation.han,
      fu: evaluation.han >= 5 ? null : fu.fu,
      isDealer: false,
      isTsumo: hand.isTsumo,
    });
    scored.push({
      interpretation,
      yaku: evaluation.yaku,
      han: evaluation.han,
      fu,
      points: pointsOf(payment),
    });
  }
  if (scored.length === 0) return { ok: false, reason: 'noYaku' };

  const best = Math.max(...scored.map((s) => s.points));
  const top = scored.filter((s) => s.points === best);
  const [first] = top;
  if (!first) return { ok: false, reason: 'noYaku' };
  if (top.some((s) => yakuKey(s.yaku) !== yakuKey(first.yaku))) {
    return { ok: false, reason: 'ambiguous' };
  }
  return {
    ok: true,
    interpretation: first.interpretation,
    yaku: first.yaku,
    han: first.han,
    fu: first.fu,
  };
}
