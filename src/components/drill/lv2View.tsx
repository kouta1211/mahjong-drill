import type { GeneratedHand } from '@/features/generate/fuHand';
import { isMenzen } from '@/features/hand/types';
import { parseFu } from '@/features/drill/levels';
import { createSessionReducer } from '@/features/drill/session';
import { formatTiles, sortTiles } from '@/features/tiles/tile';
import type { LevelView } from './DrillSession';
import { FuQuestionCard } from './FuQuestionCard';

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

/** Lv2（符計算）: 手牌から符を答える */
export const lv2View: LevelView<GeneratedHand, number> = {
  reducer: createSessionReducer<GeneratedHand, number>(isSameFu),
  format: (fu) => `${fu}符`,
  isSame: isSameFu,
  renderQuestion: (question, number, total) => (
    <FuQuestionCard question={question} number={number} total={total} />
  ),
  numberInput: {
    fields: () => [{ key: 'fu', label: '符', suffix: '符' }],
    parse: parseFu,
    toAnswer: (_, values) => values.fu ?? 0,
  },
  renderExplanation: (round) => <FuExplanation question={round.question} />,
  describe: ({ hand }) =>
    `${isMenzen(hand) ? '門前' : '副露'}・${hand.isTsumo ? 'ツモ' : 'ロン'} ${formatTiles(
      sortTiles(hand.concealed)
    )} + ${formatTiles([hand.winTile])}`,
};
