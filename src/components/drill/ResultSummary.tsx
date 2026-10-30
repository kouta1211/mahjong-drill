export type ResultItem = {
  correct: boolean;
  /** 問題の要約（例: 子・ロン 30符 3翻） */
  label: string;
  given: string;
  answer: string;
};

type Props = {
  items: ResultItem[];
  onRestart: () => void;
};

export function ResultSummary({ items, onRestart }: Props) {
  const correctCount = items.filter((h) => h.correct).length;
  const rate =
    items.length === 0 ? 0 : Math.round((correctCount / items.length) * 100);
  const mistakes = items.filter((h) => !h.correct);

  return (
    <div className="mx-auto flex w-full flex-col gap-5 lg:max-w-3xl">
      <section aria-label="結果" className="text-center">
        <p className="text-5xl font-bold tabular-nums">
          {correctCount}
          <span className="text-2xl text-zinc-500"> / {items.length}</span>
        </p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">正答率 {rate}%</p>
      </section>

      {mistakes.length > 0 ? (
        <section aria-label="間違えた問題">
          <h2 className="mb-2 font-semibold">間違えた問題</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {mistakes.map((item, i) => (
              <li
                key={i}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm tabular-nums dark:border-zinc-800"
              >
                <span className="font-medium">{item.label}</span>
                <span className="block text-zinc-600 dark:text-zinc-400">
                  あなた {item.given} → 正解{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {item.answer}
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
        className="rounded-xl bg-emerald-600 py-3 text-lg font-semibold text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none md:mx-auto md:w-80"
      >
        もう一度
      </button>
    </div>
  );
}
