import type { Question } from '@/features/drill/types';
import { Badge } from '@/components/ui/Badge';
import { TableFrame } from '@/components/ui/TableFrame';

type Props = {
  question: Question;
  number: number;
};

/** 数字を大きく、単位（符・翻）を小さく出す */
function Count({ value, unit }: { value: number; unit: string }) {
  return (
    <span>
      <span className="text-6xl leading-none lg:text-7xl">{value}</span>
      <span className="ml-1 text-2xl">{unit}</span>
    </span>
  );
}

/** Lv1 の問題。符と翻を卓の上に大きく出す */
export function QuestionCard({ question, number }: Props) {
  const { han, fu, isDealer, isTsumo, honba = 0 } = question;
  return (
    <TableFrame label={`第${number}問`} className="py-7 lg:py-14">
      <p className="flex justify-center gap-2 text-sm font-semibold">
        <Badge>{isDealer ? '親' : '子'}</Badge>
        <Badge>{isTsumo ? 'ツモ' : 'ロン'}</Badge>
        {honba > 0 && <Badge>{honba}本場</Badge>}
      </p>
      <p className="font-display mt-4 flex items-baseline justify-center gap-5 font-extrabold drop-shadow lg:mt-6">
        {fu !== null && <Count value={fu} unit="符" />}
        <Count value={han} unit="翻" />
      </p>
      {fu === null && (
        <p className="mt-1 text-xs opacity-80">
          5翻以上は符に関係なく決まります
        </p>
      )}
      <p className="mt-4 text-sm opacity-90">この和了の点数は？</p>
    </TableFrame>
  );
}
