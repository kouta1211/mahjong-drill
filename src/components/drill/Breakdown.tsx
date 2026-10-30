import type { FuResult } from '@/features/hand/calcFu';
import type { YakuHit } from '@/features/yaku/evaluateYaku';
import { YAKU } from '@/features/yaku/yakuList';

type Row = { label: string; value: string };

type Props = {
  /** 読み上げ用の表の名前 */
  caption: string;
  rows: Row[];
  total: Row;
};

/** 解説の内訳の表（符・役・ドラ）。最後の行に合計を出す */
export function BreakdownTable({ caption, rows, total }: Props) {
  return (
    <table className="w-full">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-zinc-200 dark:border-zinc-800">
            <th scope="row" className="py-1 text-left font-normal">
              {row.label}
            </th>
            <td className="py-1 text-right">{row.value}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className="pt-2 text-left">
            {total.label}
          </th>
          <td className="pt-2 text-right font-semibold">{total.value}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/** 符の内訳（Lv2・Lv4） */
export function FuBreakdown({ fu }: { fu: FuResult }) {
  return (
    <BreakdownTable
      caption="符の内訳"
      rows={fu.items.map((item) => ({
        label: item.label,
        value: `${item.fu}符`,
      }))}
      total={{
        label: '合計',
        value:
          fu.rawFu === fu.fu
            ? `${fu.fu}符`
            : `${fu.rawFu}符 → 切り上げて ${fu.fu}符`,
      }}
    />
  );
}

/** 役の内訳（Lv3・Lv4）。extraRows でドラなどを足せる */
export function YakuBreakdown({
  yaku,
  extraRows = [],
  totalHan,
}: {
  yaku: YakuHit[];
  extraRows?: Row[];
  totalHan: number;
}) {
  return (
    <BreakdownTable
      caption="役の内訳"
      rows={[
        ...yaku.map((y) => ({ label: YAKU[y.id].name, value: `${y.han}翻` })),
        ...extraRows,
      ]}
      total={{ label: '合計', value: `${totalHan}翻` }}
    />
  );
}
