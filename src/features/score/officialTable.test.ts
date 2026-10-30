import { describe, expect, it } from 'vitest';
import { calcScore, type Payment } from './calcScore';
import {
  OFFICIAL_DEALER,
  OFFICIAL_NON_DEALER,
  type OfficialRow,
} from './officialTable.fixture';
import { isPossibleCombo } from './validCombos';

type Expected = { ron: Payment | null; tsumo: Payment | null };

const MANGAN = {
  dealer: {
    ron: { kind: 'ron', total: 12000 },
    tsumo: { kind: 'tsumoDealer', all: 4000 },
  },
  nonDealer: {
    ron: { kind: 'ron', total: 8000 },
    tsumo: { kind: 'tsumoNonDealer', fromNonDealer: 2000, fromDealer: 4000 },
  },
} as const satisfies Record<string, Expected>;

/** 親のセル: 「2000 (700)」「700オール」「2400」「1500(500オール/ほか同）」 */
function parseDealerCell(cell: string): Expected {
  if (cell === '') return { ron: null, tsumo: null };
  if (cell === '満貫') return MANGAN.dealer;
  const tsumoOnly = /^(\d+)オール$/.exec(cell);
  if (tsumoOnly) {
    return {
      ron: null,
      tsumo: { kind: 'tsumoDealer', all: Number(tsumoOnly[1]) },
    };
  }
  const m = /^(\d+)\s*(?:\((\d+))?/.exec(cell);
  if (!m) throw new Error(`読めないセル: ${cell}`);
  return {
    ron: { kind: 'ron', total: Number(m[1]) },
    tsumo: m[2] ? { kind: 'tsumoDealer', all: Number(m[2]) } : null,
  };
}

/** 子のセル: 「1000 (300/500)」「400/700」「1600」 */
function parseNonDealerCell(cell: string): Expected {
  if (cell === '') return { ron: null, tsumo: null };
  if (cell === '満貫') return MANGAN.nonDealer;
  const m = /^(?:(\d+)(?!\d*\/))?\s*\(?(?:(\d+)\/(\d+))?\)?$/.exec(cell);
  if (!m || (!m[1] && !m[2])) throw new Error(`読めないセル: ${cell}`);
  return {
    ron: m[1] ? { kind: 'ron', total: Number(m[1]) } : null,
    tsumo:
      m[2] && m[3]
        ? {
            kind: 'tsumoNonDealer',
            fromNonDealer: Number(m[2]),
            fromDealer: Number(m[3]),
          }
        : null,
  };
}

const cases = (
  table: readonly OfficialRow[],
  isDealer: boolean,
  parse: (cell: string) => Expected
) =>
  table.flatMap(([fu, ...cells]) =>
    cells.map((cell, i) => ({
      label: `${isDealer ? '親' : '子'} ${fu}符${i + 1}翻「${cell || '空欄'}」`,
      fu,
      han: i + 1,
      isDealer,
      expected: parse(cell),
    }))
  );

const allCases = [
  ...cases(OFFICIAL_DEALER, true, parseDealerCell),
  ...cases(OFFICIAL_NON_DEALER, false, parseNonDealerCell),
];

describe('Mリーグ公式の早見表と一致する', () => {
  it('表を読めている（親子 × 11符 × 4翻）', () => {
    expect(allCases).toHaveLength(2 * 11 * 4);
  });

  it.each(allCases)('$label', ({ fu, han, isDealer, expected }) => {
    for (const isTsumo of [false, true]) {
      const want = isTsumo ? expected.tsumo : expected.ron;
      expect(isPossibleCombo({ han, fu, isTsumo })).toBe(want !== null);
      if (want !== null) {
        expect(calcScore({ han, fu, isDealer, isTsumo }).payment).toEqual(want);
      }
    }
  });
});
