import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { NEXT_BUTTON, PANEL } from '@/components/ui/styles';

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3"
    >
      <div role="status" className="text-center">
        <p
          className={`font-display text-3xl ${correct ? 'text-correct' : 'text-wrong'}`}
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
          className={`${PANEL} text-sm leading-relaxed tabular-nums`}
        >
          {explanation}
        </section>
      )}
      <button type="button" autoFocus onClick={onNext} className={NEXT_BUTTON}>
        {isLast ? '結果を見る' : '次へ'}
        <kbd
          aria-hidden
          className="ml-2 hidden font-sans text-xs font-normal opacity-60 pointer-fine:inline"
        >
          Enter
        </kbd>
      </button>
    </motion.div>
  );
}
