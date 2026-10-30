import { describe, expect, it } from 'vitest';
import { calcScore } from './calcScore';
import { isPossibleCombo, listPossibleCombos } from './validCombos';

describe('isPossibleCombo', () => {
  it.each([
    { han: 2, fu: 20, isTsumo: false, label: '20符ロン' },
    { han: 1, fu: 20, isTsumo: true, label: '20符1翻ツモ' },
    { han: 1, fu: 25, isTsumo: false, label: '25符1翻' },
    { han: 2, fu: 25, isTsumo: true, label: '25符2翻ツモ' },
    { han: 5, fu: 30, isTsumo: false, label: '5翻以上で符あり' },
    { han: 3, fu: null, isTsumo: false, label: '4翻以下で符なし' },
  ])('$label はありえない', (combo) => {
    expect(isPossibleCombo(combo)).toBe(false);
  });

  it.each([
    { han: 2, fu: 20, isTsumo: true, label: '20符2翻ツモ' },
    { han: 2, fu: 25, isTsumo: false, label: '25符2翻ロン' },
    { han: 3, fu: 25, isTsumo: true, label: '25符3翻ツモ' },
    { han: 1, fu: 30, isTsumo: false, label: '30符1翻ロン' },
    { han: 5, fu: null, isTsumo: true, label: '5翻ツモ' },
  ])('$label はありえる', (combo) => {
    expect(isPossibleCombo(combo)).toBe(true);
  });
});

describe('listPossibleCombos', () => {
  const combos = listPossibleCombos();

  it('すべての組み合わせがありえる形で、重複がない', () => {
    expect(combos.every(isPossibleCombo)).toBe(true);
    const keys = combos.map((c) => `${c.han}-${c.fu}-${c.isTsumo}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('すべての組み合わせで点数を計算できる', () => {
    for (const { han, fu, isTsumo } of combos) {
      for (const isDealer of [false, true]) {
        expect(() => calcScore({ han, fu, isDealer, isTsumo })).not.toThrow();
      }
    }
  });
});
