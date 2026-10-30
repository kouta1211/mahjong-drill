import type { CalledMeld } from '@/features/hand/types';
import { sortTiles, WIND, type Tile, type Wind } from '@/features/tiles/tile';

/** 牌を入れる先。副露は何番目かで指す */
export type Target = 'concealed' | 'win' | 'dora' | 'ura' | { meld: number };

export type CalculatorState = {
  concealed: Tile[];
  winTile: Tile | null;
  melds: CalledMeld[];
  indicators: Tile[];
  uraIndicators: Tile[];
  target: Target;
  roundWind: Wind;
  seatWind: Wind;
  isTsumo: boolean;
  riichi: boolean;
  honba: number;
};

export type CalculatorAction =
  | { type: 'select'; target: Target }
  | { type: 'pick'; tile: Tile }
  | { type: 'remove'; target: Target; index: number }
  | { type: 'addMeld'; meldType: CalledMeld['type'] }
  | { type: 'removeMeld'; index: number }
  | {
      type: 'setConditions';
      conditions: Partial<
        Pick<
          CalculatorState,
          'roundWind' | 'seatWind' | 'isTsumo' | 'riichi' | 'honba'
        >
      >;
    }
  | { type: 'reset' };

export const initialCalculatorState: CalculatorState = {
  concealed: [],
  winTile: null,
  melds: [],
  indicators: [],
  uraIndicators: [],
  target: 'concealed',
  roundWind: WIND.east,
  seatWind: WIND.south,
  isTsumo: false,
  riichi: false,
  honba: 0,
};

const MELD_SIZE: Record<CalledMeld['type'], number> = {
  chi: 3,
  pon: 3,
  minkan: 4,
  ankan: 4,
};

const removeAt = <T>(list: T[], index: number) =>
  list.filter((_, i) => i !== index);

/** 計算機の入力の状態遷移。入力の正しさの検証は calculate が行う */
export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  switch (action.type) {
    case 'select':
      return { ...state, target: action.target };
    case 'pick': {
      const { tile } = action;
      const { target } = state;
      if (target === 'concealed')
        return { ...state, concealed: sortTiles([...state.concealed, tile]) };
      // 和了牌は1枚なので、入れたら手牌に戻す（続けて手牌を入れやすく）
      if (target === 'win')
        return { ...state, winTile: tile, target: 'concealed' };
      if (target === 'dora')
        return { ...state, indicators: [...state.indicators, tile] };
      if (target === 'ura')
        return { ...state, uraIndicators: [...state.uraIndicators, tile] };
      const meld = state.melds[target.meld];
      // 副露は決まった枚数まで。埋まったら手牌に戻す
      if (!meld || meld.tiles.length >= MELD_SIZE[meld.type]) return state;
      const tiles = [...meld.tiles, tile];
      const melds = state.melds.map((m, i) =>
        i === target.meld ? { ...m, tiles } : m
      );
      const full = tiles.length >= MELD_SIZE[meld.type];
      return { ...state, melds, target: full ? 'concealed' : target };
    }
    case 'remove': {
      const { target, index } = action;
      if (target === 'concealed')
        return { ...state, concealed: removeAt(state.concealed, index) };
      if (target === 'win') return { ...state, winTile: null };
      if (target === 'dora')
        return { ...state, indicators: removeAt(state.indicators, index) };
      if (target === 'ura')
        return {
          ...state,
          uraIndicators: removeAt(state.uraIndicators, index),
        };
      const melds = state.melds.map((m, i) =>
        i === target.meld ? { ...m, tiles: removeAt(m.tiles, index) } : m
      );
      return { ...state, melds };
    }
    case 'addMeld': {
      const melds = [...state.melds, { type: action.meldType, tiles: [] }];
      return { ...state, melds, target: { meld: melds.length - 1 } };
    }
    case 'removeMeld':
      return {
        ...state,
        melds: removeAt(state.melds, action.index),
        target: 'concealed',
      };
    case 'setConditions':
      return { ...state, ...action.conditions };
    case 'reset':
      return initialCalculatorState;
  }
}

export const isSameTarget = (a: Target, b: Target) =>
  typeof a === 'string' || typeof b === 'string' ? a === b : a.meld === b.meld;
