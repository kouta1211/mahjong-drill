import type { Question } from '@/features/drill/types';
import { Badge } from '@/components/ui/Badge';
import { TableFrame } from '@/components/ui/TableFrame';

type Props = {
  question: Question;
  number: number;
  total: number;
};

/** Lv1 の問題。符と翻を卓の上に大きく出す */
export function QuestionCard({ question, number, total }: Props) {
  const { han, fu, isDealer, isTsumo, honba = 0 } = question;
  return (
    <TableFrame label={`第${number}問`} className="lg:py-12">
      <p className="text-sm opacity-80">
        第{number}問 / {total}問
      </p>
      <p className="mt-3 flex justify-center gap-2 text-base">
        <Badge>{isDealer ? '親' : '子'}</Badge>
        <Badge>{isTsumo ? 'ツモ' : 'ロン'}</Badge>
        {honba > 0 && <Badge>{honba}本場</Badge>}
      </p>
      <p className="font-display mt-3 text-5xl tracking-wide drop-shadow lg:mt-5 lg:text-6xl">
        {fu === null ? `${han}翻` : `${fu}符 ${han}翻`}
      </p>
      {fu === null && (
        <p className="mt-1 text-xs opacity-80">
          5翻以上は符に関係なく決まります
        </p>
      )}
    </TableFrame>
  );
}
