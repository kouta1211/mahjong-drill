import type { Payment } from '@/features/score/calcScore';
import { formatPayment, isSamePayment } from '@/features/drill/payment';

type Props = {
  choices: Payment[];
  answer: Payment;
  /** 回答済みなら、その回答 */
  given: Payment | null;
  onAnswer: (payment: Payment) => void;
};

function choiceClass(choice: Payment, answer: Payment, given: Payment | null) {
  const base =
    'rounded-xl border-2 py-4 text-xl font-semibold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none';
  if (given === null) {
    return `${base} border-zinc-300 hover:border-emerald-600 hover:bg-emerald-50 dark:border-zinc-700 dark:hover:bg-emerald-950`;
  }
  if (isSamePayment(choice, answer)) {
    return `${base} border-emerald-600 bg-emerald-600 text-white`;
  }
  if (isSamePayment(choice, given)) {
    return `${base} border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300`;
  }
  return `${base} border-zinc-200 text-zinc-400 dark:border-zinc-800`;
}

export function ChoiceAnswer({ choices, answer, given, onAnswer }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {choices.map((choice) => (
        <button
          key={formatPayment(choice)}
          type="button"
          disabled={given !== null}
          onClick={() => onAnswer(choice)}
          className={choiceClass(choice, answer, given)}
        >
          {formatPayment(choice)}
        </button>
      ))}
    </div>
  );
}
