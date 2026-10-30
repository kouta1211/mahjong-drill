import type { AnsweredQuestion } from '@/features/drill/drillReducer';
import { formatPayment } from '@/features/drill/payment';

type Props = {
  history: AnsweredQuestion[];
  onRestart: () => void;
};

export function ResultSummary({ history, onRestart }: Props) {
  const correctCount = history.filter((h) => h.correct).length;
  const rate =
    history.length === 0
      ? 0
      : Math.round((correctCount / history.length) * 100);
  const mistakes = history.filter((h) => !h.correct);

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="結果" className="text-center">
        <p className="text-5xl font-bold tabular-nums">
          {correctCount}
          <span className="text-2xl text-zinc-500"> / {history.length}</span>
        </p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">正答率 {rate}%</p>
      </section>

      {mistakes.length > 0 ? (
        <section aria-label="間違えた問題">
          <h2 className="mb-2 font-semibold">間違えた問題</h2>
          <ul className="flex flex-col gap-2">
            {mistakes.map(({ question, given }, i) => (
              <li
                key={i}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm tabular-nums dark:border-zinc-800"
              >
                <span className="font-medium">
                  {question.isDealer ? '親' : '子'}・
                  {question.isTsumo ? 'ツモ' : 'ロン'}{' '}
                  {question.fu === null ? '' : `${question.fu}符 `}
                  {question.han}翻
                </span>
                <span className="block text-zinc-600 dark:text-zinc-400">
                  あなた {formatPayment(given)} → 正解{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {formatPayment(question.answer)}
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-center font-semibold text-emerald-600">
          全問正解です！
        </p>
      )}

      <button
        type="button"
        onClick={onRestart}
        className="rounded-xl bg-emerald-600 py-3 text-lg font-semibold text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
      >
        もう一度
      </button>
    </div>
  );
}
