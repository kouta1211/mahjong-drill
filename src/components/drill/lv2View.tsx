import type { GeneratedHand } from '@/features/generate/fuHand';
import { parseFu } from '@/features/drill/levels';
import { createSessionReducer } from '@/features/drill/session';
import { FuBreakdown } from './Breakdown';
import type { LevelView } from './DrillSession';
import { describeHand, HandQuestionCard } from './HandQuestionCard';
import { NumberAnswer } from './NumberAnswer';
import { WAIT_LABEL } from '@/features/hand/calcFu';
import { interpretHand } from '@/features/hand/interpret';
import { isMenzen } from '@/features/hand/types';

const isSameFu = (a: number, b: number) => a === b;
const FU_FIELDS = [{ key: 'fu', label: '符', suffix: '符' }];

/** Lv2（符計算）: 手牌から符を答える */
export const lv2View: LevelView<GeneratedHand, number> = {
  reducer: createSessionReducer<GeneratedHand, number>(isSameFu),
  format: (fu) => `${fu}符`,
  isSame: isSameFu,
  choiceLayout: 'grid',
  renderQuestion: (question, number, total) => (
    <HandQuestionCard
      hand={question.hand}
      prompt="符はいくつ？"
      number={number}
      total={total}
    />
  ),
  renderFreeAnswer: (_, props) => (
    <NumberAnswer
      fields={FU_FIELDS}
      parse={parseFu}
      toAnswer={(values) => values.fu ?? 0}
      {...props}
    />
  ),
  renderExplanation: (round) => (
    <FuBreakdown fu={round.question.analysis.result} />
  ),
  describe: ({ hand }) => describeHand(hand),
  tagsOf: ({ question: { hand } }) => {
    const [first] = interpretHand(hand);
    return [
      isMenzen(hand) ? '門前' : '副露',
      hand.isTsumo ? 'ツモ' : 'ロン',
      ...(first
        ? [
            first.form === 'chiitoi'
              ? '七対子'
              : `待ち: ${WAIT_LABEL[first.wait]}`,
          ]
        : []),
    ];
  },
};
