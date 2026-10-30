import {
  DRAGONS,
  isYaochu,
  tileName,
  type TileKind,
} from '@/features/tiles/tile';
import { isMenzen, type Interpretation, type WinningHand } from './types';

/**
 * 符の規則は Mリーグ公式ルール 第6章第3条（docs/requirements.md 6章）。
 * 部分符の表: 中張牌 / 么九牌（老頭牌・客風牌・翻牌）× 明 / 暗
 */
const SET_FU = {
  triplet: { simple: { open: 2, closed: 4 }, yaochu: { open: 4, closed: 8 } },
  quad: { simple: { open: 8, closed: 16 }, yaochu: { open: 16, closed: 32 } },
} as const;

const BASE_FU = 20;
const MENZEN_RON_FU = 10;
const TSUMO_FU = 2;
const WAIT_FU = 2;
const VALUE_PAIR_FU = 2;
/** 副露した平和形のロンは、副底に 10符を加える */
const OPEN_PINFU_RON_FU = 10;
export const CHIITOI_FU = 25;

const tileNameOfKind = (kind: TileKind) => tileName({ kind, red: false });

export type FuItem = { label: string; fu: number };

export type FuResult = {
  /** 10符単位に切り上げた符 */
  fu: number;
  /** 切り上げる前の合計 */
  rawFu: number;
  items: FuItem[];
  isPinfu: boolean;
};

const WAIT_LABEL = {
  ryanmen: '両面',
  kanchan: '嵌張',
  penchan: '辺張',
  tanki: '単騎',
  shanpon: '双碰',
} as const;

function isValueTile(kind: TileKind, hand: WinningHand): boolean {
  return (
    (DRAGONS as readonly number[]).includes(kind) ||
    kind === hand.seatWind ||
    kind === hand.roundWind
  );
}

function setFu(
  type: 'triplet' | 'quad',
  kind: TileKind,
  open: boolean
): number {
  const row = SET_FU[type][isYaochu(kind) ? 'yaochu' : 'simple'];
  return open ? row.open : row.closed;
}

function setLabel(
  type: 'triplet' | 'quad',
  kind: TileKind,
  open: boolean
): string {
  const kindLabel = isYaochu(kind) ? '么九牌' : '中張牌';
  const name =
    type === 'triplet' ? (open ? '明刻' : '暗刻') : open ? '明槓' : '暗槓';
  return `${tileNameOfKind(kind)}の${name}（${kindLabel}）`;
}

/** 1つの解釈について、符とその内訳を求める */
export function calcFu(hand: WinningHand, it: Interpretation): FuResult {
  if (it.form === 'chiitoi') {
    return {
      fu: CHIITOI_FU,
      rawFu: CHIITOI_FU,
      items: [{ label: '七対子', fu: CHIITOI_FU }],
      isPinfu: false,
    };
  }

  const menzen = isMenzen(hand);
  const items: FuItem[] = [{ label: '副底', fu: BASE_FU }];

  const setItems: FuItem[] = [];
  it.sets.forEach((set, i) => {
    if (set.type !== 'triplet') return;
    // ロンで完成した刻子は明刻（docs/requirements.md 6章）
    const open = !hand.isTsumo && i === it.completedSetIndex;
    setItems.push({
      label: setLabel('triplet', set.kind, open),
      fu: setFu('triplet', set.kind, open),
    });
  });
  for (const meld of hand.melds) {
    const kind = meld.tiles[0]?.kind;
    if (kind === undefined || meld.type === 'chi') continue;
    const type = meld.type === 'pon' ? 'triplet' : 'quad';
    const open = meld.type !== 'ankan';
    setItems.push({
      label: setLabel(type, kind, open),
      fu: setFu(type, kind, open),
    });
  }

  const pairFu = isValueTile(it.pair, hand) ? VALUE_PAIR_FU : 0;
  const waitFu =
    it.wait === 'kanchan' || it.wait === 'penchan' || it.wait === 'tanki'
      ? WAIT_FU
      : 0;

  const allSequences =
    it.sets.every((s) => s.type === 'sequence') &&
    hand.melds.every((m) => m.type === 'chi');
  const pinfuShape = allSequences && pairFu === 0 && it.wait === 'ryanmen';
  const isPinfu = menzen && pinfuShape;

  items.push(...setItems);
  if (pairFu > 0) {
    items.push({
      label: `雀頭（${tileNameOfKind(it.pair)}・役牌）`,
      fu: pairFu,
    });
  }
  if (waitFu > 0)
    items.push({ label: `待ち（${WAIT_LABEL[it.wait]}）`, fu: waitFu });
  if (menzen && !hand.isTsumo)
    items.push({ label: '門前ロン', fu: MENZEN_RON_FU });
  if (hand.isTsumo && !isPinfu) items.push({ label: 'ツモ', fu: TSUMO_FU });
  if (!menzen && !hand.isTsumo && pinfuShape) {
    items.push({ label: '副露した平和形のロン', fu: OPEN_PINFU_RON_FU });
  }

  const rawFu = items.reduce((sum, item) => sum + item.fu, 0);
  return { fu: Math.ceil(rawFu / 10) * 10, rawFu, items, isPinfu };
}
