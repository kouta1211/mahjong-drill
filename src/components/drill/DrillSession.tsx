'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Fragment, useReducer, type ReactNode } from 'react';
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
  renderQuestion: (question: Q, number: number, total: number) => ReactNode;
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
};

type Props<Q, A> = {
  rounds: Round<Q, A>[];
  view: LevelView<Q, A>;
  settings: DrillSettings;
  onExit: () => void;
};

export function DrillSession<Q, A>({
  rounds,
  view,
  settings,
  onExit,
}: Props<Q, A>) {
  const [state, dispatch] = useReducer(view.reducer, rounds, startSession);

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
    // 問題ごとに横へすべらせて入れ替える。PC では左に問題、右に回答と解説を並べる
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={state.index}
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -32 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8"
      >
        <div className="lg:sticky lg:top-8">
          {view.renderQuestion(
            round.question,
            state.index + 1,
            state.rounds.length
          )}
        </div>
        <div className="flex flex-col gap-5">
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
                settings.showExplanation ? view.renderExplanation(round) : null
              }
              isLast={state.index + 1 === state.rounds.length}
              onNext={() => dispatch({ type: 'next' })}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
