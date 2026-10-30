import type { ReactNode } from 'react';
import { isMenzen, type WinningHand } from '@/features/hand/types';
import { formatTiles, sortTiles, tileName } from '@/features/tiles/tile';
import { HandView } from '@/components/tiles/HandView';
import { Badge } from '@/components/ui/Badge';
import { TableFrame } from '@/components/ui/TableFrame';

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
    <TableFrame label={`第${number}問`} className="lg:py-8">
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
      <div className="mt-4 rounded-xl bg-black/15 px-1 py-3 shadow-inner sm:px-3">
        <HandView hand={hand} />
      </div>
      {children}
    </TableFrame>
  );
}

/** 結果画面の一覧に出す、手牌の要約（例: 門前・ツモ 234m567p… + 5p） */
export const describeHand = (hand: WinningHand) =>
  `${isMenzen(hand) ? '門前' : '副露'}・${hand.isTsumo ? 'ツモ' : 'ロン'} ${formatTiles(
    sortTiles(hand.concealed)
  )} + ${formatTiles([hand.winTile])}`;
