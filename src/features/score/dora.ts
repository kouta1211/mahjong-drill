import type { WinningHand } from '@/features/hand/types';
import {
  isHonor,
  kindOf,
  rankOf,
  suitOf,
  type Tile,
  type TileKind,
} from '@/features/tiles/tile';

/**
 * ドラ表示牌の「次順牌」をドラとする（Mリーグ公式ルール 第2章第6条）。
 * 三元牌は白→發→中の順。数牌の 9 の次は 1、北の次は東、中の次は白と一周する
 * （条文は「次順牌」までで、一周は「次順」の意味からの読み。docs/requirements.md 6章）。
 */
export function doraKindOf(indicator: TileKind): TileKind {
  const rank = rankOf(indicator);
  const suit = suitOf(indicator);
  if (!isHonor(indicator)) return kindOf(suit, rank === 9 ? 1 : rank + 1);
  // 字牌: 東南西北（1〜4）と白發中（5〜7）を、それぞれの中で一周させる
  if (rank <= 4) return kindOf('z', rank === 4 ? 1 : rank + 1);
  return kindOf('z', rank === 7 ? 5 : rank + 1);
}

export type DoraCount = {
  /** 表ドラ（槓ドラを含む） */
  dora: number;
  /** 裏ドラ（立直のときだけ） */
  ura: number;
  red: number;
  total: number;
};

const allTiles = (hand: WinningHand): Tile[] => [
  ...hand.concealed,
  hand.winTile,
  ...hand.melds.flatMap((m) => m.tiles),
];

function countMatches(tiles: Tile[], indicators: readonly Tile[]): number {
  const doraKinds = indicators.map((i) => doraKindOf(i.kind));
  // 同じドラが2つの表示牌から重なれば、1枚につき2翻になる
  return tiles.reduce(
    (n, t) => n + doraKinds.filter((k) => k === t.kind).length,
    0
  );
}

/** 手牌のドラの数。どのドラも1枚1翻（第2章第6条） */
export function countDora(
  hand: WinningHand,
  indicators: readonly Tile[],
  uraIndicators: readonly Tile[]
): DoraCount {
  const tiles = allTiles(hand);
  const dora = countMatches(tiles, indicators);
  const ura = hand.riichi ? countMatches(tiles, uraIndicators) : 0;
  const red = tiles.filter((t) => t.red).length;
  return { dora, ura, red, total: dora + ura + red };
}
