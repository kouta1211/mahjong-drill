import type { Payment } from '@/features/score/calcScore';
import { explain } from '@/features/drill/explain';
import {
  formatPayment,
  isSamePayment,
  parsePoints,
} from '@/features/drill/payment';
import { createSessionReducer } from '@/features/drill/session';
import type { Question } from '@/features/drill/types';
import type { LevelView } from './DrillSession';
import type { NumberField } from './NumberAnswer';
import { QuestionCard } from './QuestionCard';

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

/** Lv1（早見表）: 符・翻から点数を答える */
export const lv1View: LevelView<Question, Payment> = {
  reducer: createSessionReducer<Question, Payment>(isSamePayment),
  format: formatPayment,
  isSame: isSamePayment,
  renderQuestion: (question, number, total) => (
    <QuestionCard question={question} number={number} total={total} />
  ),
  numberInput: {
    fields: (round) => PAYMENT_FIELDS[round.answer.kind],
    parse: parsePoints,
    toAnswer: (round, values) => toPayment(round.answer.kind, values),
  },
  renderExplanation: (round) => (
    <ol className="list-decimal pl-5">
      {explain(round.question).map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  ),
  describe: (q) =>
    `${q.isDealer ? '親' : '子'}・${q.isTsumo ? 'ツモ' : 'ロン'} ${
      q.fu === null ? '' : `${q.fu}符 `
    }${q.han}翻`,
};
