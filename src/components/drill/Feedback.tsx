import type { ReactNode } from 'react';

type Props = {
  correct: boolean;
  givenText: string;
  answerText: string;
  /** 解説なしの設定なら null */
  explanation: ReactNode | null;
  isLast: boolean;
  onNext: () => void;
};

export function Feedback({
  correct,
  givenText,
  answerText,
  explanation,
  isLast,
  onNext,
}: Props) {
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
            あなたの答え {givenText} → 正解 <strong>{answerText}</strong>
          </p>
        )}
      </div>
      {explanation !== null && (
        <section
          aria-label="解説"
          className="rounded-xl bg-zinc-100 p-3 text-sm leading-relaxed tabular-nums dark:bg-zinc-900"
        >
          {explanation}
        </section>
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
