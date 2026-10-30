import { parseTiles, WIND, type Wind } from '@/features/tiles/tile';
import type { CalledMeld, WinningHand } from './types';

type Options = {
  melds?: [CalledMeld['type'], string][];
  isTsumo?: boolean;
  roundWind?: Wind;
  seatWind?: Wind;
  riichi?: boolean;
};

/** テスト用。表記の文字列から和了手を作る */
export function testHand(
  concealed: string,
  win: string,
  options: Options = {}
): WinningHand {
  const [winTile] = parseTiles(win);
  if (!winTile) throw new Error(`和了牌がありません: ${win}`);
  const hand: WinningHand = {
    concealed: parseTiles(concealed),
    melds: (options.melds ?? []).map(([type, tiles]) => ({
      type,
      tiles: parseTiles(tiles),
    })),
    winTile,
    isTsumo: options.isTsumo ?? false,
    roundWind: options.roundWind ?? WIND.east,
    seatWind: options.seatWind ?? WIND.south,
    riichi: options.riichi ?? false,
  };
  // テストの手牌の書き間違い（枚数の過不足）を、期待値を見る前に止める
  const quads = hand.melds.filter((m) => m.tiles.length === 4).length;
  const total =
    hand.concealed.length +
    1 +
    hand.melds.reduce((n, m) => n + m.tiles.length, 0);
  if (total !== 14 + quads) {
    throw new Error(
      `手牌の枚数が ${total} 枚です（${14 + quads} 枚のはず）: ${concealed} + ${win}`
    );
  }
  return hand;
}
