import type { AnsweredQuestion } from '@/features/drill/drillReducer';
import { explain } from '@/features/drill/explain';
import { formatPayment } from '@/features/drill/payment';

type Props = {
  answered: AnsweredQuestion;
  showExplanation: boolean;
  isLast: boolean;
  onNext: () => void;
};

export function Feedback({ answered, showExplanation, isLast, onNext }: Props) {
  const { question, given, correct } = answered;
  return (
    <div className="flex flex-col gap-3">
      <div role="status" className="text-center">
        <p
          className={`text-2xl font-bold ${correct ? 'text-emerald-600' : 'text-rose-600'}`}
        >
          {correct ? '正解！' : '不正解'}
        </p>
        {!correct && (
          <p className="mt-1 tabular-nums">
            あなたの答え {formatPayment(given)} → 正解{' '}
            <strong>{formatPayment(question.answer)}</strong>
          </p>
        )}
      </div>
      {showExplanation && (
        <ol className="list-decimal rounded-xl bg-zinc-100 py-3 pr-3 pl-8 text-sm leading-relaxed tabular-nums dark:bg-zinc-900">
          {explain(question).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      <button
        type="button"
        autoFocus
        onClick={onNext}
        className="rounded-xl bg-zinc-800 py-3 text-lg font-semibold text-white hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:bg-zinc-200 dark:text-zinc-900"
      >
        {isLast ? '結果を見る' : '次へ'}
        <kbd
          aria-hidden
          className="ml-2 hidden font-sans text-xs font-normal opacity-60 pointer-fine:inline"
        >
          Enter
        </kbd>
      </button>
    </div>
  );
}
