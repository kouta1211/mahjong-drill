import type { Question } from '@/features/drill/types';

type Props = {
  question: Question;
  number: number;
  total: number;
};

export function QuestionCard({ question, number, total }: Props) {
  const { han, fu, isDealer, isTsumo } = question;
  return (
    <section
      aria-label={`第${number}問`}
      className="rounded-2xl bg-emerald-800 px-4 py-6 text-center text-white shadow"
    >
      <p className="text-sm opacity-80">
        第{number}問 / {total}問
      </p>
      <p className="mt-3 flex justify-center gap-2 text-base">
        <span className="rounded-full bg-white/15 px-3 py-0.5">
          {isDealer ? '親' : '子'}
        </span>
        <span className="rounded-full bg-white/15 px-3 py-0.5">
          {isTsumo ? 'ツモ' : 'ロン'}
        </span>
      </p>
      <p className="mt-3 text-4xl font-bold tracking-wide">
        {fu === null ? `${han}翻` : `${fu}符 ${han}翻`}
      </p>
      {fu === null && (
        <p className="mt-1 text-xs opacity-80">
          5翻以上は符に関係なく決まります
        </p>
      )}
    </section>
  );
}
