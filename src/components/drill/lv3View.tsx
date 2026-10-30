import { createSessionReducer } from '@/features/drill/session';
import {
  formatYaku,
  isSameYaku,
  type YakuAnswer,
} from '@/features/drill/yakuAnswer';
import type { GeneratedYakuHand } from '@/features/generate/yakuHand';
import { isMenzen } from '@/features/hand/types';
import { YakuBreakdown } from './Breakdown';
import type { LevelView } from './DrillSession';
import { describeHand, HandQuestionCard } from './HandQuestionCard';
import { YakuPicker } from './YakuPicker';

/** Lv3（役・翻）: 手牌から成立する役を答える */
export const lv3View: LevelView<GeneratedYakuHand, YakuAnswer> = {
  reducer: createSessionReducer<GeneratedYakuHand, YakuAnswer>(isSameYaku),
  format: formatYaku,
  isSame: isSameYaku,
  choiceLayout: 'list',
  renderQuestion: (question, number, total) => (
    <HandQuestionCard
      hand={question.hand}
      prompt="役は？"
      number={number}
      total={total}
    />
  ),
  renderFreeAnswer: (round, props) => (
    <YakuPicker menzen={isMenzen(round.question.hand)} {...props} />
  ),
  renderExplanation: ({ question: { analysis } }) => (
    <YakuBreakdown yaku={analysis.yaku} totalHan={analysis.han} />
  ),
  describe: ({ hand }) => describeHand(hand),
};
