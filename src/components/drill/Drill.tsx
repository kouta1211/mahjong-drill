'use client';

import { useReducer, useState } from 'react';
import { drillReducer, initialDrillState } from '@/features/drill/drillReducer';
import { createStartAction } from '@/features/drill/startDrill';
import type { Rng } from '@/features/drill/types';
import { ChoiceAnswer } from './ChoiceAnswer';
import { Feedback } from './Feedback';
import { NumberAnswer } from './NumberAnswer';
import { QuestionCard } from './QuestionCard';
import { ResultSummary } from './ResultSummary';
import { SetupForm } from './SetupForm';

type Props = {
  /** テストで出題を固定するために差し替える */
  rng?: Rng;
};

export function Drill({ rng = Math.random }: Props) {
  const [state, dispatch] = useReducer(drillReducer, initialDrillState);
  const [startError, setStartError] = useState<string | null>(null);

  if (state.phase === 'setup') {
    return (
      <>
        <SetupForm
          settings={state.settings}
          onChange={(settings) =>
            dispatch({ type: 'updateSettings', settings })
          }
          onStart={() => {
            try {
              dispatch(createStartAction(state.settings, rng));
              setStartError(null);
            } catch (e) {
              setStartError(
                e instanceof Error ? e.message : '問題を作れませんでした'
              );
            }
          }}
        />
        {startError && (
          <p role="alert" className="mt-3 text-sm text-rose-600">
            {startError}
          </p>
        )}
      </>
    );
  }

  if (state.phase === 'result') {
    return (
      <ResultSummary
        history={state.history}
        onRestart={() => dispatch({ type: 'restart' })}
      />
    );
  }

  const question = state.questions[state.index];
  const choices = state.choices[state.index];
  if (!question || !choices) return null;
  const given = state.current?.given ?? null;

  return (
    // PC では左に問題、右に回答と解説を並べる
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-8">
        <QuestionCard
          question={question}
          number={state.index + 1}
          total={state.questions.length}
        />
      </div>
      <div className="flex flex-col gap-5">
        {state.settings.answerMode === 'choice' ? (
          <ChoiceAnswer
            choices={choices}
            answer={question.answer}
            given={given}
            onAnswer={(payment) => dispatch({ type: 'answer', given: payment })}
          />
        ) : (
          <NumberAnswer
            // 問題ごとに入力欄を空に戻す
            key={state.index}
            kind={question.answer.kind}
            disabled={given !== null}
            onAnswer={(payment) => dispatch({ type: 'answer', given: payment })}
          />
        )}
        {state.current && (
          <Feedback
            answered={state.current}
            showExplanation={state.settings.showExplanation}
            isLast={state.index + 1 === state.questions.length}
            onNext={() => dispatch({ type: 'next' })}
          />
        )}
      </div>
    </div>
  );
}
