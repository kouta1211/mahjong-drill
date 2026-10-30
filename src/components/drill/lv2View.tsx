import type { GeneratedHand } from '@/features/generate/fuHand';
import { parseFu } from '@/features/drill/levels';
import { createSessionReducer } from '@/features/drill/session';
import type { LevelView } from './DrillSession';
import { describeHand, HandQuestionCard } from './HandQuestionCard';
import { NumberAnswer } from './NumberAnswer';

function FuExplanation({ question }: { question: GeneratedHand }) {
  const { items, rawFu, fu } = question.analysis.result;
  return (
    <table className="w-full">
      <caption className="sr-only">符の内訳</caption>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} className="border-b border-zinc-200 dark:border-zinc-800">
            <th scope="row" className="py-1 text-left font-normal">
              {item.label}
            </th>
            <td className="py-1 text-right">{item.fu}符</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className="pt-2 text-left">
            合計
          </th>
          <td className="pt-2 text-right font-semibold">
            {rawFu === fu ? `${fu}符` : `${rawFu}符 → 切り上げて ${fu}符`}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

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
  renderExplanation: (round) => <FuExplanation question={round.question} />,
  describe: ({ hand }) => describeHand(hand),
};
