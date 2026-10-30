import type { Payment } from '@/features/score/calcScore';
import { explain } from '@/features/drill/explain';
import { formatPayment, isSamePayment } from '@/features/drill/payment';
import { createSessionReducer } from '@/features/drill/session';
import type { Question } from '@/features/drill/types';
import type { LevelView } from './DrillSession';
import { PaymentAnswer } from './PaymentAnswer';
import { QuestionCard } from './QuestionCard';

/** Lv1（早見表）: 符・翻から点数を答える */
export const lv1View: LevelView<Question, Payment> = {
  reducer: createSessionReducer<Question, Payment>(isSamePayment),
  format: formatPayment,
  isSame: isSamePayment,
  choiceLayout: 'grid',
  renderQuestion: (question, number, total) => (
    <QuestionCard question={question} number={number} total={total} />
  ),
  renderFreeAnswer: (round, props) => (
    <PaymentAnswer kind={round.answer.kind} {...props} />
  ),
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
