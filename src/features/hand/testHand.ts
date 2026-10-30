import { parseTiles, WIND, type Wind } from '@/features/tiles/tile';
import type { CalledMeld, WinningHand } from './types';

type Options = {
  melds?: [CalledMeld['type'], string][];
  isTsumo?: boolean;
  roundWind?: Wind;
  seatWind?: Wind;
};

/** テスト用。表記の文字列から和了手を作る */
export function testHand(
  concealed: string,
  win: string,
  options: Options = {}
): WinningHand {
  const [winTile] = parseTiles(win);
  if (!winTile) throw new Error(`和了牌がありません: ${win}`);
  return {
    concealed: parseTiles(concealed),
    melds: (options.melds ?? []).map(([type, tiles]) => ({
      type,
      tiles: parseTiles(tiles),
    })),
    winTile,
    isTsumo: options.isTsumo ?? false,
    roundWind: options.roundWind ?? WIND.east,
    seatWind: options.seatWind ?? WIND.south,
    riichi: false,
  };
}
