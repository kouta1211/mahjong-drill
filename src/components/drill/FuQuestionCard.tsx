import type { GeneratedHand } from '@/features/hand/generateHand';
import { tileName } from '@/features/tiles/tile';
import { HandView } from '@/components/tiles/HandView';

type Props = {
  question: GeneratedHand;
  number: number;
  total: number;
};

const windName = (kind: number) => tileName({ kind, red: false });

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/15 px-3 py-0.5">{children}</span>
  );
}

export function FuQuestionCard({ question: { hand }, number, total }: Props) {
  return (
    <section
      aria-label={`第${number}問`}
      className="rounded-2xl bg-emerald-800 px-2 py-5 text-center text-white shadow sm:px-4 lg:py-8"
    >
      <p className="text-sm opacity-80">
        第{number}問 / {total}問 ・ 符はいくつ？
      </p>
      <p className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
        <Badge>{windName(hand.roundWind)}場</Badge>
        <Badge>自風 {windName(hand.seatWind)}</Badge>
        <Badge>{hand.isTsumo ? 'ツモ' : 'ロン'}</Badge>
        {hand.riichi && <Badge>リーチ</Badge>}
      </p>
      <div className="mt-4 rounded-xl bg-emerald-900/60 px-1 py-3 sm:px-3">
        <HandView hand={hand} />
      </div>
    </section>
  );
}
