import { MLEAGUE_RULES, type ScoreRules } from './rules';

export type ScoreInput = {
  han: number;
  /** 5翻以上では点数に影響しないため null でよい */
  fu: number | null;
  isDealer: boolean;
  isTsumo: boolean;
};

export type Payment =
  | { kind: 'ron'; total: number }
  | { kind: 'tsumoNonDealer'; fromNonDealer: number; fromDealer: number }
  | { kind: 'tsumoDealer'; all: number };

export type LimitName =
  'mangan' | 'haneman' | 'baiman' | 'sanbaiman' | 'yakuman';

export type ScoreResult = {
  /** 満貫などに切り上げる前の基本点（符 × 2^(翻+2)）。5翻以上は null */
  rawBasePoints: number | null;
  /** 支払いの元になる基本点 */
  basePoints: number;
  /** 満貫以上なら区分名、満貫未満なら null */
  limit: LimitName | null;
  payment: Payment;
};

/** 早見表に載っている符（25符は七対子のみ）。Lv1 の出題範囲に使う */
export const FU_VALUES = [
  20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110,
] as const;

const LIMIT_BASE_POINTS: Record<LimitName, number> = {
  mangan: 2000,
  haneman: 3000,
  baiman: 4000,
  sanbaiman: 6000,
  yakuman: 8000,
};

export function ceil100(points: number): number {
  return Math.ceil(points / 100) * 100;
}

/**
 * 切り上げ満貫の対象。公式ルール 第6章第4条「30符6翻は切り上げ満貫」と、
 * 第6条の満貫の定義「60符以上の5翻」（どちらも場ゾロ2翻込み）による。
 * 基本点が同じ 1920 でも、120符2翻は対象にしない。
 */
const isKiriageTarget = (han: number, fu: number | null) =>
  (han === 4 && fu === 30) || (han === 3 && fu === 60);

function limitOf(
  han: number,
  fu: number | null,
  basePoints: number,
  rules: ScoreRules
): LimitName | null {
  if (han >= 13) return rules.kazoeYakuman ? 'yakuman' : 'sanbaiman';
  if (han >= 11) return 'sanbaiman';
  if (han >= 8) return 'baiman';
  if (han >= 6) return 'haneman';
  if (han === 5 || basePoints >= LIMIT_BASE_POINTS.mangan) return 'mangan';
  if (rules.kiriageMangan && isKiriageTarget(han, fu)) {
    return 'mangan';
  }
  return null;
}

function validate({ han, fu }: ScoreInput): void {
  if (!Number.isInteger(han) || han < 1) {
    throw new RangeError(`翻は1以上の整数で指定してください: ${han}`);
  }
  if (han >= 5) return;
  if (fu === null) {
    throw new RangeError(`4翻以下では符が必要です: ${han}翻`);
  }
  // 早見表（FU_VALUES）は 110符までだが、么九牌の暗槓が重なる手などはそれを超える
  const validFu =
    fu === 25 || (Number.isInteger(fu) && fu >= 20 && fu % 10 === 0);
  if (!validFu) {
    throw new RangeError(`符の値が不正です: ${fu}`);
  }
}

/** 符・翻・親子・ツモロンから、支払う点数を求める */
export function calcScore(
  input: ScoreInput,
  rules: ScoreRules = MLEAGUE_RULES
): ScoreResult {
  validate(input);
  const { han, fu, isDealer, isTsumo } = input;

  const rawBase = han >= 5 || fu === null ? 0 : fu * 2 ** (han + 2);
  const limit = limitOf(han, fu, rawBase, rules);
  const basePoints = limit === null ? rawBase : LIMIT_BASE_POINTS[limit];

  return {
    rawBasePoints: han >= 5 ? null : rawBase,
    basePoints,
    limit,
    payment: paymentOf(basePoints, isDealer, isTsumo),
  };
}

/** 基本点から支払いを求める。ロンは子×4・親×6、ツモは子が基本点・親が×2（100点単位に切り上げ） */
function paymentOf(
  basePoints: number,
  isDealer: boolean,
  isTsumo: boolean
): Payment {
  if (!isTsumo) {
    return { kind: 'ron', total: ceil100(basePoints * (isDealer ? 6 : 4)) };
  }
  if (isDealer) return { kind: 'tsumoDealer', all: ceil100(basePoints * 2) };
  return {
    kind: 'tsumoNonDealer',
    fromNonDealer: ceil100(basePoints),
    fromDealer: ceil100(basePoints * 2),
  };
}

/**
 * 役満の点数。公式ルール 第6章第6条「役満。散家 32,000点 荘家 48,000点」
 * 「役満の複合はあり。2つの場合…2倍、3つの場合は…3倍」。count は役満の数。
 */
export function calcYakumanScore(
  count: number,
  isDealer: boolean,
  isTsumo: boolean
): Payment {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`役満の数は1以上の整数で指定してください: ${count}`);
  }
  return paymentOf(LIMIT_BASE_POINTS.yakuman * count, isDealer, isTsumo);
}
