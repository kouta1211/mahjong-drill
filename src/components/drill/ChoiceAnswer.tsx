'use client';

import { useEffect } from 'react';
type Props<A> = {
  choices: A[];
  answer: A;
  /** 回答済みなら、その回答 */
  given: A | null;
  format: (answer: A) => string;
  isSame: (a: A, b: A) => boolean;
  onAnswer: (answer: A) => void;
};

function choiceClass<A>(
  choice: A,
  answer: A,
  given: A | null,
  isSame: (a: A, b: A) => boolean
) {
  const base =
    'relative rounded-xl border-2 py-4 text-xl font-semibold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none';
  if (given === null) {
    return `${base} border-zinc-300 hover:border-emerald-600 hover:bg-emerald-50 dark:border-zinc-700 dark:hover:bg-emerald-950`;
  }
  if (isSame(choice, answer)) {
    return `${base} border-emerald-600 bg-emerald-600 text-white`;
  }
  if (isSame(choice, given)) {
    return `${base} border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300`;
  }
  return `${base} border-zinc-200 text-zinc-400 dark:border-zinc-800`;
}

/** 入力欄で打った数字や、修飾キー付きの操作は選択肢として扱わない */
function isPlainKey(e: KeyboardEvent): boolean {
  if (e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return false;
  const target = e.target;
  return !(
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

export function ChoiceAnswer<A>({
  choices,
  answer,
  given,
  format,
  isSame,
  onAnswer,
}: Props<A>) {
  // キーボードの 1〜4 で選ぶ
  useEffect(() => {
    if (given !== null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPlainKey(e) || !/^[1-9]$/.test(e.key)) return;
      const choice = choices[Number(e.key) - 1];
      if (choice === undefined) return;
      e.preventDefault();
      onAnswer(choice);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [choices, given, onAnswer]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-2">
      {choices.map((choice, i) => (
        <button
          key={format(choice)}
          type="button"
          disabled={given !== null}
          onClick={() => onAnswer(choice)}
          className={choiceClass(choice, answer, given, isSame)}
        >
          <kbd
            aria-hidden
            className="absolute top-1.5 left-2 hidden font-sans text-xs font-normal opacity-60 pointer-fine:inline"
          >
            {i + 1}
          </kbd>
          {format(choice)}
        </button>
      ))}
    </div>
  );
}
