import type { ReactNode } from 'react';
import { isMenzen, type WinningHand } from '@/features/hand/types';
import { formatTiles, sortTiles, tileName } from '@/features/tiles/tile';
import { HandView } from '@/components/tiles/HandView';

type Props = {
  hand: WinningHand;
  /** 問いかけ（例: 符はいくつ？） */
  prompt: string;
  number: number;
  total: number;
  /** 親か子かを見せる（Lv4）。省略すると出さない */
  isDealer?: boolean;
  /** 手牌の下に出すもの（Lv4 のドラ表示牌） */
  children?: ReactNode;
};

const windName = (kind: number) => tileName({ kind, red: false });

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/15 px-3 py-0.5">{children}</span>
  );
}

/** 手牌を見せる問題（Lv2〜Lv4） */
export function HandQuestionCard({
  hand,
  prompt,
  number,
  total,
  isDealer,
  children,
}: Props) {
  return (
    <section
      aria-label={`第${number}問`}
      className="rounded-2xl bg-emerald-800 px-2 py-5 text-center text-white shadow sm:px-4 lg:py-8"
    >
      <p className="text-sm opacity-80">
        第{number}問 / {total}問 ・ {prompt}
      </p>
      <p className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
        {isDealer !== undefined && <Badge>{isDealer ? '親' : '子'}</Badge>}
        <Badge>{windName(hand.roundWind)}場</Badge>
        <Badge>自風 {windName(hand.seatWind)}</Badge>
        <Badge>{hand.isTsumo ? 'ツモ' : 'ロン'}</Badge>
        {hand.riichi && <Badge>リーチ</Badge>}
      </p>
      <div className="mt-4 rounded-xl bg-emerald-900/60 px-1 py-3 sm:px-3">
        <HandView hand={hand} />
      </div>
      {children}
    </section>
  );
}

/** 結果画面の一覧に出す、手牌の要約（例: 門前・ツモ 234m567p… + 5p） */
export const describeHand = (hand: WinningHand) =>
  `${isMenzen(hand) ? '門前' : '副露'}・${hand.isTsumo ? 'ツモ' : 'ロン'} ${formatTiles(
    sortTiles(hand.concealed)
  )} + ${formatTiles([hand.winTile])}`;
