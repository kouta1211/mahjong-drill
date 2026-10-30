import type { Tile, TileKind, Wind } from '@/features/tiles/tile';

/** 副露（チー・ポン・明槓）と暗槓。手の中で固定された面子 */
export type CalledMeld =
  | { type: 'chi'; tiles: Tile[] }
  | { type: 'pon'; tiles: Tile[] }
  | { type: 'minkan'; tiles: Tile[] }
  | { type: 'ankan'; tiles: Tile[] };

export type WinningHand = {
  /** 副露・暗槓以外の手牌。和了牌は含まない */
  concealed: Tile[];
  melds: CalledMeld[];
  winTile: Tile;
  isTsumo: boolean;
  roundWind: Wind;
  seatWind: Wind;
  riichi: boolean;
};

/** 手の中（副露以外）を分解してできた面子 */
export type ConcealedSet = { type: 'sequence' | 'triplet'; kind: TileKind };

export type Decomposition =
  | { form: 'standard'; pair: TileKind; sets: ConcealedSet[] }
  | { form: 'chiitoi'; pairs: TileKind[] };

/** 和了牌が完成させた部分。符の「待ち」はこれで決まる */
export type WaitShape = 'ryanmen' | 'kanchan' | 'penchan' | 'tanki' | 'shanpon';

/** 分解のしかたと、和了牌をどこに入れたかの組。符はこの単位で決まる */
export type Interpretation =
  | {
      form: 'standard';
      pair: TileKind;
      sets: ConcealedSet[];
      wait: WaitShape;
      /** shanpon のとき、和了牌で完成した刻子の sets 内の位置 */
      completedSetIndex: number | null;
    }
  | { form: 'chiitoi'; pairs: TileKind[]; wait: 'tanki' };

export const isMenzen = (hand: WinningHand) =>
  hand.melds.every((m) => m.type === 'ankan');
