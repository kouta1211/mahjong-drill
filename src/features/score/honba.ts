import type { Payment } from './calcScore';

/**
 * 本場（積み棒）の加算。Mリーグ公式ルール 第3章「一本場につき300点をアガリ点に加算する」。
 * ツモは支払う人それぞれに 100点ずつ（第6章第5条の例「1300・2600は1400・2700」）。
 */
export const HONBA_RON = 300;
export const HONBA_TSUMO_EACH = 100;

export function addHonba(payment: Payment, honba: number): Payment {
  if (!Number.isInteger(honba) || honba < 0) {
    throw new RangeError(`本場は 0 以上の整数で指定してください: ${honba}`);
  }
  const each = HONBA_TSUMO_EACH * honba;
  switch (payment.kind) {
    case 'ron':
      return { kind: 'ron', total: payment.total + HONBA_RON * honba };
    case 'tsumoDealer':
      return { kind: 'tsumoDealer', all: payment.all + each };
    case 'tsumoNonDealer':
      return {
        kind: 'tsumoNonDealer',
        fromNonDealer: payment.fromNonDealer + each,
        fromDealer: payment.fromDealer + each,
      };
  }
}
