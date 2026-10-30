'use client';

import { motion, type TargetAndTransition } from 'motion/react';
import { useEffect } from 'react';

type Props<A> = {
  choices: A[];
  answer: A;
  /** 回答済みなら、その回答 */
  given: A | null;
  format: (answer: A) => string;
  isSame: (a: A, b: A) => boolean;
  onAnswer: (answer: A) => void;
  /** grid: 短い答え（点数・符）を2列に / list: 長い答え（役の組み合わせ）を1列に */
  layout?: 'grid' | 'list';
};

type ChoiceState = 'open' | 'correct' | 'wrong' | 'other';

function choiceState<A>(
  choice: A,
  answer: A,
  given: A | null,
  isSame: (a: A, b: A) => boolean
): ChoiceState {
  if (given === null) return 'open';
  if (isSame(choice, answer)) return 'correct';
  if (isSame(choice, given)) return 'wrong';
  return 'other';
}

// 象牙色の牌のような見た目。下の縁を厚くして立体に見せる
const CHOICE_BASE =
  'relative rounded-xl border-2 border-b-[6px] font-semibold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-felt-light focus-visible:outline-none';

const CHOICE_CLASS: Record<ChoiceState, string> = {
  open: 'border-line border-b-ivory-edge bg-ivory text-ink hover:border-felt-light',
  correct: 'border-correct-strong bg-correct-strong text-on-dark',
  wrong: 'border-wrong bg-wrong/10 text-wrong',
  other: 'border-line border-b-ivory-edge bg-ivory text-ink opacity-45',
};

/** 答えたあとの反応。正解は軽く弾み、選んだ誤答は小さく揺れる */
const CHOICE_MOTION: Record<ChoiceState, TargetAndTransition> = {
  open: {},
  correct: { scale: [1, 1.06, 1], transition: { duration: 0.3 } },
  wrong: { x: [0, -7, 7, -4, 4, 0], transition: { duration: 0.35 } },
  other: {},
};

/** 数字はそのまま、単位や区切り（符・オール・-）は小さく出す。読み上げる名前は元の文字列のまま */
function ScoreText({ text }: { text: string }) {
  return text
    .split(/(\d+)/)
    .filter((part) => part !== '')
    .map((part, i) =>
      /^\d+$/.test(part) ? (
        <span key={i}>{part}</span>
      ) : (
        <span key={i} className="mx-0.5 font-sans text-sm font-medium">
          {part}
        </span>
      )
    );
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
  layout = 'grid',
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
    <div
      className={
        layout === 'grid'
          ? 'grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-2'
          : 'flex flex-col gap-2'
      }
    >
      {choices.map((choice, i) => {
        const state = choiceState(choice, answer, given, isSame);
        return (
          <motion.button
            key={format(choice)}
            type="button"
            disabled={given !== null}
            onClick={() => onAnswer(choice)}
            animate={CHOICE_MOTION[state]}
            whileTap={given === null ? { scale: 0.97 } : undefined}
            className={`${CHOICE_BASE} ${CHOICE_CLASS[state]} ${
              layout === 'grid'
                ? 'font-display py-5 text-2xl font-extrabold md:text-3xl'
                : 'px-8 py-3 text-left text-base'
            }`}
          >
            <kbd
              aria-hidden
              className="absolute top-1.5 left-2 hidden font-sans text-xs font-normal opacity-60 pointer-fine:inline"
            >
              {i + 1}
            </kbd>
            {layout === 'grid' ? (
              <ScoreText text={format(choice)} />
            ) : (
              format(choice)
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
