'use client';

import { motion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { sortTiles } from '@/features/tiles/tile';
import type { CalledMeld, WinningHand } from '@/features/hand/types';
import { Tile } from './Tile';

const MELD_LABEL: Record<CalledMeld['type'], string> = {
  chi: 'チー',
  pon: 'ポン',
  minkan: '明槓',
  ankan: '暗槓',
};

/** 配牌の間隔（秒）。牌が左から順に置かれていく */
const DEAL_INTERVAL = 0.025;
/** 和了牌の前に置く間（牌何枚分か） */
const WIN_TILE_PAUSE = 3;

/** 牌を上から置く動き。order の順に少しずつ遅らせる */
function Dealt({ order, children }: { order: number; children: ReactNode }) {
  return (
    <motion.span
      className="flex items-end"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: order * DEAL_INTERVAL, duration: 0.18 }}
    >
      {children}
    </motion.span>
  );
}

function MeldView({
  meld,
  firstOrder,
}: {
  meld: CalledMeld;
  firstOrder: number;
}) {
  return (
    <span
      role="group"
      aria-label={MELD_LABEL[meld.type]}
      className="flex items-end"
    >
      {meld.tiles.map((tile, i) => (
        <Dealt key={i} order={firstOrder + i}>
          <Tile
            tile={tile}
            // 鳴いた牌は1枚目を横向きに置く（誰から鳴いたかは問わない）
            sideways={meld.type !== 'ankan' && i === 0}
            faceDown={
              meld.type === 'ankan' && (i === 0 || i === meld.tiles.length - 1)
            }
          />
        </Dealt>
      ))}
    </span>
  );
}

/** 1行に置ける牌の数（横向きの牌は 4/3 枚分）の上限。これを超えるなら副露を次の行に回す */
const MAX_UNITS_PER_ROW = 15;
const GROUP_GAP = 0.5;
const MELD_GAP = 0.2;
/** 端数で折り返しが起きないための余白 */
const SLACK = 0.3;

/**
 * 牌の幅を「枠の幅 ÷ 1行の牌の数」で決める。
 * 手牌と副露が1行に収まるなら1行分、収まらないなら多い方の行で割る。
 */
function tileWidthDivisor(hand: WinningHand): number {
  const handUnits = hand.concealed.length + GROUP_GAP + 1;
  const meldUnits = hand.melds.reduce(
    (sum, m, i) =>
      sum +
      m.tiles.length +
      (m.type === 'ankan' ? 0 : 1 / 3) +
      (i > 0 ? MELD_GAP : 0),
    0
  );
  const oneRow = handUnits + (meldUnits > 0 ? GROUP_GAP + meldUnits : 0);
  const units =
    oneRow <= MAX_UNITS_PER_ROW ? oneRow : Math.max(handUnits, meldUnits);
  return units + SLACK;
}

/** 手牌全体。門前の牌 → 和了牌（少し離す）→ 副露 の順に並べる */
export function HandView({ hand }: { hand: WinningHand }) {
  // CSS 変数は CSSProperties の型にないため、ここだけ型を広げる
  const style = {
    '--tw': `min(calc(100cqw / ${tileWidthDivisor(hand)}), 3rem)`,
  } as CSSProperties;
  const winOrder = hand.concealed.length + WIN_TILE_PAUSE;
  return (
    <div className="@container w-full">
      <div
        style={style}
        className="flex flex-wrap items-end justify-center gap-x-[calc(var(--tw)*0.5)] gap-y-2"
      >
        <span role="group" aria-label="手牌" className="flex items-end">
          {sortTiles(hand.concealed).map((tile, i) => (
            <Dealt key={i} order={i}>
              <Tile tile={tile} />
            </Dealt>
          ))}
        </span>
        <span
          role="group"
          aria-label={hand.isTsumo ? 'ツモした牌' : 'ロンした牌'}
          className="flex flex-col items-center"
        >
          <Dealt order={winOrder}>
            <Tile tile={hand.winTile} highlight />
          </Dealt>
        </span>
        {hand.melds.length > 0 && (
          <span className="flex items-end gap-[calc(var(--tw)*0.2)]">
            {hand.melds.map((meld, i) => (
              <MeldView
                key={i}
                meld={meld}
                firstOrder={
                  winOrder +
                  1 +
                  hand.melds.slice(0, i).reduce((n, m) => n + m.tiles.length, 0)
                }
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
