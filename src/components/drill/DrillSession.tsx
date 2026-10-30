'use client';

import { useReducer, type ReactNode } from 'react';
import {
  startSession,
  type Round,
  type SessionAction,
  type SessionState,
} from '@/features/drill/session';
import type { DrillSettings } from '@/features/drill/types';
import type { ParseResult } from '@/lib/parseNumber';
import { ChoiceAnswer } from './ChoiceAnswer';
import { Feedback } from './Feedback';
import { NumberAnswer, type NumberField } from './NumberAnswer';
import { ResultSummary } from './ResultSummary';

/** レベルごとに違う部分。Lv1 は lv1View.tsx、Lv2 は lv2View.tsx */
export type LevelView<Q, A> = {
  reducer: (
    state: SessionState<Q, A>,
    action: SessionAction<A>
  ) => SessionState<Q, A>;
  format: (answer: A) => string;
  isSame: (a: A, b: A) => boolean;
  renderQuestion: (question: Q, number: number, total: number) => ReactNode;
  numberInput: {
    fields: (round: Round<Q, A>) => NumberField[];
    parse: (raw: string) => ParseResult;
    toAnswer: (round: Round<Q, A>, values: Record<string, number>) => A;
  };
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
    // PC では左に問題、右に回答と解説を並べる
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
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
          />
        ) : (
          <NumberAnswer
            // 問題ごとに入力欄を空に戻す
            key={state.index}
            fields={view.numberInput.fields(round)}
            parse={view.numberInput.parse}
            toAnswer={(values) => view.numberInput.toAnswer(round, values)}
            disabled={given !== null}
            onAnswer={onAnswer}
          />
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
    </div>
  );
}
