import type { CSSProperties, ReactNode } from 'react';
import { tileName, type Tile as TileData } from '@/features/tiles/tile';
import { Tile } from '@/components/tiles/Tile';

// CSS 変数は CSSProperties の型にないため、ここだけ型を広げる
const SLOT_STYLE = { '--tw': 'clamp(1.5rem, 6.5vw, 2.25rem)' } as CSSProperties;

type Props = {
  label: string;
  tiles: TileData[];
  /** 牌を入れる先として選ばれているか */
  active: boolean;
  onSelect: () => void;
  onRemove: (index: number) => void;
  /** 何枚入れるかの目安（例: 13枚） */
  hint?: string;
  /** 見出しの横に置く操作（副露を消すボタンなど） */
  action?: ReactNode;
};

/**
 * 牌の入れ先（手牌・和了牌・副露・ドラ表示牌）。押すと入れ先になり、
 * 中の牌を押すとその牌を外す。
 */
export function TileSlot({
  label,
  tiles,
  active,
  onSelect,
  onRemove,
  hint,
  action,
}: Props) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`rounded-xl border-2 p-2 transition-colors ${
        active ? 'border-felt bg-felt/10' : 'border-line bg-ivory'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={active}
          className="text-left text-sm font-semibold focus-visible:ring-2 focus-visible:ring-felt-light focus-visible:outline-none"
        >
          {label}
          {hint && (
            <span className="ml-2 text-xs font-normal text-muted">{hint}</span>
          )}
          {active && (
            <span className="ml-2 text-xs font-normal text-felt">
              ← ここに入れる
            </span>
          )}
        </button>
        {action}
      </div>
      <div
        style={SLOT_STYLE}
        className="flex min-h-[calc(var(--tw)*4/3)] flex-wrap gap-0.5"
      >
        {tiles.length === 0 ? (
          <button
            type="button"
            onClick={onSelect}
            className="text-xs text-muted"
          >
            （空）押してからパレットの牌を選ぶ
          </button>
        ) : (
          tiles.map((tile, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${tileName(tile)}を外す`}
              onClick={() => onRemove(i)}
              className="rounded-[10%] focus-visible:ring-2 focus-visible:ring-wrong focus-visible:outline-none"
            >
              <Tile tile={tile} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
