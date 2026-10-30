import type { CSSProperties } from 'react';
import type { Tile as TileData } from '@/features/tiles/tile';
import { Tile } from './Tile';

// CSS 変数は CSSProperties の型にないため、ここだけ型を広げる
const SMALL_TILE = { '--tw': '1.75rem' } as CSSProperties;

function IndicatorRow({ label, tiles }: { label: string; tiles: TileData[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs opacity-80">{label}</span>
      <span role="group" aria-label={label} className="flex gap-0.5">
        {tiles.map((tile, i) => (
          <Tile key={i} tile={tile} />
        ))}
      </span>
    </div>
  );
}

type Props = {
  indicators: TileData[];
  /** 立直していなければ空 */
  uraIndicators: TileData[];
};

/** ドラ表示牌と裏ドラ表示牌（Lv4） */
export function DoraView({ indicators, uraIndicators }: Props) {
  return (
    <div
      style={SMALL_TILE}
      className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2"
    >
      <IndicatorRow label="ドラ表示牌" tiles={indicators} />
      {uraIndicators.length > 0 && (
        <IndicatorRow label="裏ドラ表示牌" tiles={uraIndicators} />
      )}
    </div>
  );
}
