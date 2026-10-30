import { calcFu, type FuResult } from '@/features/hand/calcFu';
import { interpretHand } from '@/features/hand/interpret';
import type { Interpretation, WinningHand } from '@/features/hand/types';
import { calcScore, type Payment } from '@/features/score/calcScore';
import { isHonor, suitOf } from '@/features/tiles/tile';
import { evaluateYaku, isChuurenShape, type YakuHit } from './evaluateYaku';
import type { YakumanId } from './yakuList';

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

export type ScoredInterpretation = {
  interpretation: Interpretation;
  yaku: YakuHit[];
  han: number;
  fu: FuResult;
  /** 子の支払いの合計（解釈どうしを比べるため） */
  points: number;
};

export type Ranking =
  | { kind: 'yakuman'; yakuman: YakumanId[] }
  | { kind: 'noYaku' }
  /** 最も点の高い解釈。同点なら複数 */
  | { kind: 'normal'; top: ScoredInterpretation[] };

/**
 * 解釈を点数で比べ、最も高いものを返す（高点法、公式ルール 第6章第5条）。
 * 役満になる解釈があれば、役満の数が最も多いものを返す（役満はそれ以外より必ず高い）。
 * ドリル（analyzeHand）と点数計算機の両方から使う。
 */
export function rankInterpretations(
  hand: WinningHand,
  interpretations: Interpretation[]
): Ranking {
  let bestYakuman: YakumanId[] | null = null;
  const scored: ScoredInterpretation[] = [];
  for (const interpretation of interpretations) {
    const evaluation = evaluateYaku(hand, interpretation);
    if (evaluation.kind === 'yakuman') {
      if (!bestYakuman || evaluation.yakuman.length > bestYakuman.length) {
        bestYakuman = evaluation.yakuman;
      }
      continue;
    }
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
  if (bestYakuman) return { kind: 'yakuman', yakuman: bestYakuman };
  if (scored.length === 0) return { kind: 'noYaku' };
  const best = Math.max(...scored.map((s) => s.points));
  return { kind: 'normal', top: scored.filter((s) => s.points === best) };
}

/** 暗槓を含む九蓮宝燈の形か（役満になるかを公式で確かめられていない） */
export function isChuurenWithAnkan(hand: WinningHand): boolean {
  const kinds = [
    ...hand.concealed,
    hand.winTile,
    ...hand.melds.flatMap((m) => m.tiles),
  ].map((t) => t.kind);
  const oneSuit = new Set(kinds.map(suitOf)).size === 1 && !kinds.some(isHonor);
  return (
    hand.melds.some((m) => m.type === 'ankan') &&
    oneSuit &&
    isChuurenShape(kinds)
  );
}

/** 同点の解釈どうしで、役の組み合わせが食い違っているか */
export const hasConflictingYaku = (top: ScoredInterpretation[]) =>
  top.some((s) => yakuKey(s.yaku) !== yakuKey(top[0]?.yaku ?? []));

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
  if (isChuurenWithAnkan(hand)) return { ok: false, reason: 'unconfirmedRule' };

  const ranking = rankInterpretations(hand, interpretations);
  if (ranking.kind === 'yakuman') return { ok: false, reason: 'yakuman' };
  if (ranking.kind === 'noYaku') return { ok: false, reason: 'noYaku' };
  const [first] = ranking.top;
  if (!first) return { ok: false, reason: 'noYaku' };
  if (hasConflictingYaku(ranking.top))
    return { ok: false, reason: 'ambiguous' };
  return {
    ok: true,
    interpretation: first.interpretation,
    yaku: first.yaku,
    han: first.han,
    fu: first.fu,
  };
}
