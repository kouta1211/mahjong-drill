import { createSessionReducer } from '@/features/drill/session';
import {
  formatYaku,
  isSameYaku,
  type YakuAnswer,
} from '@/features/drill/yakuAnswer';
import type { GeneratedYakuHand } from '@/features/generate/yakuHand';
import { isMenzen } from '@/features/hand/types';
import { YAKU } from '@/features/yaku/yakuList';
import type { LevelView } from './DrillSession';
import { describeHand, HandQuestionCard } from './HandQuestionCard';
import { YakuPicker } from './YakuPicker';

function YakuExplanation({ question }: { question: GeneratedYakuHand }) {
  const { yaku, han, fu } = question.analysis;
  return (
    <table className="w-full">
      <caption className="sr-only">役の内訳</caption>
      <tbody>
        {yaku.map((y) => (
          <tr
            key={y.id}
            className="border-b border-zinc-200 dark:border-zinc-800"
          >
            <th scope="row" className="py-1 text-left font-normal">
              {YAKU[y.id].name}
            </th>
            <td className="py-1 text-right">{y.han}翻</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className="pt-2 text-left">
            合計
          </th>
          <td className="pt-2 text-right font-semibold">
            {han}翻
            <span className="ml-2 text-xs font-normal text-zinc-500">
              （{fu.fu}符）
            </span>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

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
  renderExplanation: (round) => <YakuExplanation question={round.question} />,
  describe: ({ hand }) => describeHand(hand),
};
