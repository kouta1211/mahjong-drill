import { describe, expect, it } from 'vitest';
import { addHonba } from './honba';

describe('addHonba（公式ルール 第3章・第6章第5条）', () => {
  it('条文の例: 一本場の子のツモ 1300・2600 は 1400・2700', () => {
    expect(
      addHonba(
        { kind: 'tsumoNonDealer', fromNonDealer: 1300, fromDealer: 2600 },
        1
      )
    ).toEqual({
      kind: 'tsumoNonDealer',
      fromNonDealer: 1400,
      fromDealer: 2700,
    });
  });

  it('ロンは 1本場につき 300点（2本場で +600）', () => {
    expect(addHonba({ kind: 'ron', total: 3900 }, 2)).toEqual({
      kind: 'ron',
      total: 4500,
    });
  });

  it('親のツモは子3人がそれぞれ 100点ずつ多く払う', () => {
    expect(addHonba({ kind: 'tsumoDealer', all: 1300 }, 3)).toEqual({
      kind: 'tsumoDealer',
      all: 1600,
    });
  });

  it('0本場なら変わらない', () => {
    expect(addHonba({ kind: 'ron', total: 8000 }, 0)).toEqual({
      kind: 'ron',
      total: 8000,
    });
  });

  it.each([-1, 1.5])('不正な本場 %s は RangeError', (honba) => {
    expect(() => addHonba({ kind: 'ron', total: 1000 }, honba)).toThrow(
      RangeError
    );
  });
});
