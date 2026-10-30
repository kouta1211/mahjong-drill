import { describe, expect, it } from 'vitest';
import { formatPayment, isSamePayment, parsePoints } from './payment';

describe('formatPayment', () => {
  it.each([
    [{ kind: 'ron', total: 3900 } as const, '3900'],
    [
      {
        kind: 'tsumoNonDealer',
        fromNonDealer: 1000,
        fromDealer: 2000,
      } as const,
      '1000-2000',
    ],
    [{ kind: 'tsumoDealer', all: 2000 } as const, '2000オール'],
  ])('%o → %s', (payment, expected) => {
    expect(formatPayment(payment)).toBe(expected);
  });
});

describe('isSamePayment', () => {
  it('子ツモは子と親の支払いが両方そろって一致', () => {
    const answer = {
      kind: 'tsumoNonDealer',
      fromNonDealer: 1000,
      fromDealer: 2000,
    } as const;
    expect(isSamePayment(answer, { ...answer })).toBe(true);
    expect(
      isSamePayment(answer, {
        ...answer,
        fromNonDealer: 2000,
        fromDealer: 1000,
      })
    ).toBe(false);
  });
});

describe('parsePoints', () => {
  it.each([
    ['3900', 3900],
    [' 12000 ', 12000],
    ['１２，０００'.replace('，', ','), 12000],
    ['１０００', 1000],
  ])('%s → %d', (raw, value) => {
    expect(parsePoints(raw)).toEqual({ ok: true, value });
  });

  it.each([
    ['', '点数を入力してください'],
    ['abc', '数字だけで入力してください'],
    ['-1000', '数字だけで入力してください'],
    ['3.9', '数字だけで入力してください'],
    ['0', '0より大きい点数を入力してください'],
    ['3950', '100点単位で入力してください'],
  ])('%s はエラー「%s」', (raw, error) => {
    expect(parsePoints(raw)).toEqual({ ok: false, error });
  });
});
