'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Fragment, useEffect, useReducer, useRef, type ReactNode } from 'react';
import {
  startSession,
  type Round,
  type SessionAction,
  type SessionState,
} from '@/features/drill/session';
import type { DrillSettings } from '@/features/drill/types';
import { ChoiceAnswer } from './ChoiceAnswer';
import { Feedback } from './Feedback';
import { ResultSummary } from './ResultSummary';

export type FreeAnswerProps<A> = {
  disabled: boolean;
  onAnswer: (answer: A) => void;
};

/** レベルごとに違う部分。lv1View.tsx・lv2View.tsx・lv3View.tsx */
export type LevelView<Q, A> = {
  reducer: (
    state: SessionState<Q, A>,
    action: SessionAction<A>
  ) => SessionState<Q, A>;
  format: (answer: A) => string;
  isSame: (a: A, b: A) => boolean;
  renderQuestion: (question: Q, number: number) => ReactNode;
  /** 4択の並べ方。答えが長いレベルは list */
  choiceLayout: 'grid' | 'list';
  /** 4択以外の答え方（Lv1・Lv2 は数値入力、Lv3 は役を選ぶ） */
  renderFreeAnswer: (
    round: Round<Q, A>,
    props: FreeAnswerProps<A>
  ) => ReactNode;
  renderExplanation: (round: Round<Q, A>) => ReactNode;
  /** 結果画面の一覧に出す、問題の要約 */
  describe: (question: Q) => string;
  /** 成績の分類（苦手分析の単位）。例: 子・ロン、役: 一気通貫 */
  tagsOf: (round: Round<Q, A>) => string[];
};

export type FinishedAnswer = { correct: boolean; tags: string[] };

type Props<Q, A> = {
  rounds: Round<Q, A>[];
  view: LevelView<Q, A>;
  settings: DrillSettings;
  onExit: () => void;
  /** 最後の問題に答えて結果画面に移ったとき、1回だけ呼ぶ */
  onFinish?: (answers: FinishedAnswer[]) => void;
};

export function DrillSession<Q, A>({
  rounds,
  view,
  settings,
  onExit,
  onFinish,
}: Props<Q, A>) {
  const [state, dispatch] = useReducer(view.reducer, rounds, startSession);

  // 結果画面に移ったら1回だけ知らせる。onFinish は親が描画し直すたびに新しく作られ、
  // そのたびにこの副作用が動くので、目印で2回目以降を止める（二重保存の防止）
  const finished = useRef(false);
  useEffect(() => {
    if (state.phase !== 'result' || finished.current) return;
    finished.current = true;
    onFinish?.(
      state.history.map((h) => ({
        correct: h.correct,
        tags: view.tagsOf(h.round),
      }))
    );
  }, [state, onFinish, view]);

  if (state.phase === 'result') {
    return (
      <ResultSummary
        items={state.history.map((h) => ({
          correct: h.correct,
          label: view.describe(h.round.question),
          given: view.format(h.given),
          answer: view.format(h.round.answer),
        }))}
        onRestart={onExit}
      />
    );
  }

  const round = state.rounds[state.index];
  if (!round) return null;
  const given = state.current?.given ?? null;
  const onAnswer = (answer: A) => dispatch({ type: 'answer', given: answer });

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Progress number={state.index + 1} total={state.rounds.length} />
      {/* 問題ごとに横へすべらせて入れ替える。PC では左に問題、右に回答と解説を並べる */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state.index}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-1 flex-col gap-5 md:flex-none lg:grid lg:grid-cols-2 lg:items-start lg:gap-8"
        >
          <div className="lg:sticky lg:top-8">
            {view.renderQuestion(round.question, state.index + 1)}
          </div>
          {/* スマホでは親指が届くよう、回答を画面の下へ寄せる */}
          <div className="mt-auto flex flex-col gap-5 md:mt-0">
            {settings.answerMode === 'choice' ? (
              <ChoiceAnswer
                choices={round.choices}
                answer={round.answer}
                given={given}
                format={view.format}
                isSame={view.isSame}
                onAnswer={onAnswer}
                layout={view.choiceLayout}
              />
            ) : (
              // 問題ごとに入力を空に戻す
              <Fragment key={state.index}>
                {view.renderFreeAnswer(round, {
                  disabled: given !== null,
                  onAnswer,
                })}
              </Fragment>
            )}
            {state.current && (
              <Feedback
                correct={state.current.correct}
                givenText={view.format(state.current.given)}
                answerText={view.format(round.answer)}
                explanation={
                  settings.showExplanation
                    ? view.renderExplanation(round)
                    : null
                }
                isLast={state.index + 1 === state.rounds.length}
                onNext={() => dispatch({ type: 'next' })}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** 卓の外に出す進み具合。数字は見た目用で、読み上げは aria-valuetext で行う */
function Progress({ number, total }: { number: number; total: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div
        role="progressbar"
        aria-label="進み具合"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={number}
        aria-valuetext={`第${number}問 / ${total}問`}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-felt transition-[width] duration-300 dark:bg-muted"
          style={{ width: `${(number / total) * 100}%` }}
        />
      </div>
      <span aria-hidden className="font-semibold tabular-nums">
        {number} / {total}
      </span>
    </div>
  );
}
