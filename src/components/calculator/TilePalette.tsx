import type { CSSProperties } from 'react';
import {
  kindOf,
  tileName,
  type Suit,
  type Tile as TileData,
} from '@/features/tiles/tile';
import { Tile } from '@/components/tiles/Tile';

const NUMBER_ROWS: { suit: Exclude<Suit, 'z'>; label: string }[] = [
  { suit: 'm', label: '萬子' },
  { suit: 'p', label: '筒子' },
  { suit: 's', label: '索子' },
];

/** 1段に並べる牌の数（1〜9 と赤5）。この数で枠の幅を割って牌の幅を決める */
const TILES_PER_ROW = 10;
// CSS 変数は CSSProperties の型にないため、ここだけ型を広げる
const PALETTE_STYLE = {
  '--tw': `min(calc((100cqw - ${TILES_PER_ROW - 1} * 0.25rem) / ${TILES_PER_ROW}), 2.5rem)`,
} as CSSProperties;

function rowTiles(suit: Exclude<Suit, 'z'>): TileData[] {
  const tiles: TileData[] = [];
  for (let rank = 1; rank <= 9; rank++)
    tiles.push({ kind: kindOf(suit, rank), red: false });
  tiles.push({ kind: kindOf(suit, 5), red: true });
  return tiles;
}

const HONORS: TileData[] = Array.from({ length: 7 }, (_, i) => ({
  kind: kindOf('z', i + 1),
  red: false,
}));

/** 牌を選ぶパレット。押した牌を onPick で渡す */
export function TilePalette({ onPick }: { onPick: (tile: TileData) => void }) {
  const rows = [
    ...NUMBER_ROWS.map((r) => ({ label: r.label, tiles: rowTiles(r.suit) })),
    { label: '字牌', tiles: HONORS },
  ];
  return (
    <div className="@container w-full" style={PALETTE_STYLE}>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            role="group"
            aria-label={row.label}
            className="flex flex-wrap gap-1"
          >
            {row.tiles.map((tile) => (
              <button
                key={`${tile.kind}-${tile.red}`}
                type="button"
                aria-label={`${tileName(tile)}を入れる`}
                onClick={() => onPick(tile)}
                className="rounded-[10%] transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-felt-light focus-visible:outline-none active:translate-y-0"
              >
                <Tile tile={tile} />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
