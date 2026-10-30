import { parsePoints } from '@/features/drill/payment';
import type { Payment } from '@/features/score/calcScore';
import { NumberAnswer, type NumberField } from './NumberAnswer';

const PAYMENT_FIELDS: Record<Payment['kind'], NumberField[]> = {
  ron: [{ key: 'total', label: 'ロンの点数' }],
  tsumoDealer: [{ key: 'all', label: '子1人あたりの支払い', suffix: 'オール' }],
  tsumoNonDealer: [
    { key: 'fromNonDealer', label: '子の支払い' },
    { key: 'fromDealer', label: '親の支払い' },
  ],
};

function toPayment(
  kind: Payment['kind'],
  values: Record<string, number>
): Payment {
  const get = (key: string) => values[key] ?? 0;
  switch (kind) {
    case 'ron':
      return { kind, total: get('total') };
    case 'tsumoDealer':
      return { kind, all: get('all') };
    case 'tsumoNonDealer':
      return {
        kind,
        fromNonDealer: get('fromNonDealer'),
        fromDealer: get('fromDealer'),
      };
  }
}

type Props = {
  /** 答える形式（ロン / 子のツモ / 親のツモ）。正解の種類から決まる */
  kind: Payment['kind'];
  disabled: boolean;
  onAnswer: (payment: Payment) => void;
};

/** 支払う点数の数値入力（Lv1・Lv4）。子のツモは子と親の2欄 */
export function PaymentAnswer({ kind, disabled, onAnswer }: Props) {
  return (
    <NumberAnswer
      fields={PAYMENT_FIELDS[kind]}
      parse={parsePoints}
      toAnswer={(values) => toPayment(kind, values)}
      disabled={disabled}
      onAnswer={onAnswer}
    />
  );
}
