/** 1問分。Q は問題、A は答えの型（Lv1 は点数、Lv2 は符） */
export type Round<Q, A> = {
  question: Q;
  answer: A;
  /** 4択の選択肢。数値入力のときも作っておく */
  choices: A[];
};

export type Answered<Q, A> = {
  round: Round<Q, A>;
  given: A;
  correct: boolean;
};

export type SessionState<Q, A> =
  | {
      phase: 'playing';
      rounds: Round<Q, A>[];
      index: number;
      history: Answered<Q, A>[];
      /** 回答済みで「次へ」を待っているとき、その回答 */
      current: Answered<Q, A> | null;
    }
  | { phase: 'result'; history: Answered<Q, A>[] };

export type SessionAction<A> = { type: 'answer'; given: A } | { type: 'next' };

/** 開始時の状態。問題が0問なら始められない */
export function startSession<Q, A>(rounds: Round<Q, A>[]): SessionState<Q, A> {
  if (rounds.length === 0) throw new Error('問題がありません');
  return { phase: 'playing', rounds, index: 0, history: [], current: null };
}

/**
 * 出題中 → 結果 の状態遷移。答えの比べ方だけをレベルごとに渡す。
 * 想定外の順番で届いたアクションは無視して、状態を変えない。
 */
export function createSessionReducer<Q, A>(isSame: (a: A, b: A) => boolean) {
  return function sessionReducer(
    state: SessionState<Q, A>,
    action: SessionAction<A>
  ): SessionState<Q, A> {
    if (state.phase !== 'playing') return state;
    switch (action.type) {
      case 'answer': {
        const round = state.rounds[state.index];
        if (state.current !== null || !round) return state;
        const answered: Answered<Q, A> = {
          round,
          given: action.given,
          correct: isSame(round.answer, action.given),
        };
        return {
          ...state,
          current: answered,
          history: [...state.history, answered],
        };
      }
      case 'next': {
        if (state.current === null) return state;
        const nextIndex = state.index + 1;
        if (nextIndex >= state.rounds.length) {
          return { phase: 'result', history: state.history };
        }
        return { ...state, index: nextIndex, current: null };
      }
    }
  };
}
