import type { Payment } from '@/features/score/calcScore';

/** 卓での申告と同じ表記にする（例: 3900 / 1000-2000 / 2000オール） */
export function formatPayment(payment: Payment): string {
  switch (payment.kind) {
    case 'ron':
      return `${payment.total}`;
    case 'tsumoNonDealer':
      return `${payment.fromNonDealer}-${payment.fromDealer}`;
    case 'tsumoDealer':
      return `${payment.all}オール`;
  }
}

/** 支払いの合計。選択肢を近い点数から選ぶときに使う */
export function totalOf(payment: Payment): number {
  switch (payment.kind) {
    case 'ron':
      return payment.total;
    case 'tsumoNonDealer':
      return payment.fromNonDealer * 2 + payment.fromDealer;
    case 'tsumoDealer':
      return payment.all * 3;
  }
}

export function isSamePayment(a: Payment, b: Payment): boolean {
  return formatPayment(a) === formatPayment(b);
}

export type ParseResult =
  { ok: true; value: number } | { ok: false; error: string };

/** 数値入力欄の文字列を点数として読む。全角数字も受け付ける */
export function parsePoints(raw: string): ParseResult {
  const normalized = raw
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/,/g, '');
  if (normalized === '') return { ok: false, error: '点数を入力してください' };
  if (!/^\d+$/.test(normalized)) {
    return { ok: false, error: '数字だけで入力してください' };
  }
  const value = Number(normalized);
  if (value <= 0)
    return { ok: false, error: '0より大きい点数を入力してください' };
  if (value % 100 !== 0) {
    return { ok: false, error: '100点単位で入力してください' };
  }
  return { ok: true, value };
}
