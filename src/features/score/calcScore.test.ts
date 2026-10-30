import { describe, expect, it } from 'vitest';
import { calcScore, FU_VALUES, type Payment } from './calcScore';
import { MLEAGUE_RULES } from './rules';

// 期待値は早見表から写さず、公式から手で計算している。
//   基本点 = 符 × 2^(翻+2)
//   子ロン = 基本点×4、親ロン = 基本点×6、子ツモ = 基本点(子) / 基本点×2(親)、親ツモ = 基本点×2 オール
//   それぞれ 100点単位に切り上げ
type Case = {
  name: string;
  han: number;
  fu: number | null;
  isDealer: boolean;
  isTsumo: boolean;
  expected: Payment;
};

const cases: Case[] = [
  {
    // 30×8=240 → ×4=960 → 1000
    name: '子 30符1翻 ロン',
    han: 1,
    fu: 30,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 1000 },
  },
  {
    // 100×8=800 → ×4=3200
    name: '子 100符1翻 ロン',
    han: 1,
    fu: 100,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 3200 },
  },
  {
    // 40×8=320 → ×6=1920 → 2000
    name: '親 40符1翻 ロン',
    han: 1,
    fu: 40,
    isDealer: true,
    isTsumo: false,
    expected: { kind: 'ron', total: 2000 },
  },
  {
    // 20×16=320 → 子 320→400 / 親 640→700
    name: '子 20符2翻 ツモ（ピンフツモ）',
    han: 2,
    fu: 20,
    isDealer: false,
    isTsumo: true,
    expected: { kind: 'tsumoNonDealer', fromNonDealer: 400, fromDealer: 700 },
  },
  {
    // 25×16=400 → ×4=1600
    name: '子 25符2翻 ロン（七対子）',
    han: 2,
    fu: 25,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 1600 },
  },
  {
    // 30×16=480 → ×2=960 → 1000オール
    name: '親 30符2翻 ツモ',
    han: 2,
    fu: 30,
    isDealer: true,
    isTsumo: true,
    expected: { kind: 'tsumoDealer', all: 1000 },
  },
  {
    // 30×32=960 → ×4=3840 → 3900
    name: '子 30符3翻 ロン',
    han: 3,
    fu: 30,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 3900 },
  },
  {
    // 40×32=1280 → ×4=5120 → 5200
    name: '子 40符3翻 ロン',
    han: 3,
    fu: 40,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 5200 },
  },
  {
    // 30×64=1920 → 切り上げ満貫で基本点2000 → ×4=8000
    name: '子 30符4翻 ロン（切り上げ満貫）',
    han: 4,
    fu: 30,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 8000 },
  },
  {
    // 60×32=1920 → 切り上げ満貫で基本点2000 → ×6=12000
    name: '親 60符3翻 ロン（切り上げ満貫）',
    han: 3,
    fu: 60,
    isDealer: true,
    isTsumo: false,
    expected: { kind: 'ron', total: 12000 },
  },
  {
    // 30×64=1920 → 切り上げ満貫 → 子2000 / 親4000
    name: '子 30符4翻 ツモ（切り上げ満貫）',
    han: 4,
    fu: 30,
    isDealer: false,
    isTsumo: true,
    expected: { kind: 'tsumoNonDealer', fromNonDealer: 2000, fromDealer: 4000 },
  },
  {
    // 70×32=2240 → 2000を超えるので満貫 → ×4=8000
    name: '子 70符3翻 ロン（基本点が満貫を超える）',
    han: 3,
    fu: 70,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 8000 },
  },
  {
    // 満貫 2000 → ×4=8000
    name: '子 5翻 ロン（満貫）',
    han: 5,
    fu: null,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 8000 },
  },
  {
    // 跳満 3000 → 子3000 / 親6000
    name: '子 6翻 ツモ（跳満）',
    han: 6,
    fu: null,
    isDealer: false,
    isTsumo: true,
    expected: { kind: 'tsumoNonDealer', fromNonDealer: 3000, fromDealer: 6000 },
  },
  {
    // 跳満 3000 → ×6=18000
    name: '親 7翻 ロン（跳満）',
    han: 7,
    fu: null,
    isDealer: true,
    isTsumo: false,
    expected: { kind: 'ron', total: 18000 },
  },
  {
    // 倍満 4000 → ×2=8000オール
    name: '親 8翻 ツモ（倍満）',
    han: 8,
    fu: null,
    isDealer: true,
    isTsumo: true,
    expected: { kind: 'tsumoDealer', all: 8000 },
  },
  {
    // 倍満 4000 → ×4=16000
    name: '子 10翻 ロン（倍満の上端）',
    han: 10,
    fu: null,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 16000 },
  },
  {
    // 三倍満 6000 → ×4=24000
    name: '子 11翻 ロン（三倍満）',
    han: 11,
    fu: null,
    isDealer: false,
    isTsumo: false,
    expected: { kind: 'ron', total: 24000 },
  },
  {
    // 数え役満なし → 三倍満 6000 → ×6=36000
    name: '親 13翻 ロン（数え役満なしなので三倍満）',
    han: 13,
    fu: null,
    isDealer: true,
    isTsumo: false,
    expected: { kind: 'ron', total: 36000 },
  },
];

describe('calcScore（Mリーグルール）', () => {
  it.each(cases)('$name', ({ han, fu, isDealer, isTsumo, expected }) => {
    expect(calcScore({ han, fu, isDealer, isTsumo }).payment).toEqual(expected);
  });

  it('満貫未満は区分名を持たない', () => {
    const result = calcScore({
      han: 3,
      fu: 40,
      isDealer: false,
      isTsumo: false,
    });
    expect(result.limit).toBeNull();
    expect(result.basePoints).toBe(1280);
  });

  it('翻が増えても点数は下がらない（全ての符・親子・ツモロン）', () => {
    const total = (p: Payment) =>
      p.kind === 'ron'
        ? p.total
        : p.kind === 'tsumoDealer'
          ? p.all * 3
          : p.fromNonDealer * 2 + p.fromDealer;
    for (const fu of FU_VALUES) {
      for (const isDealer of [false, true]) {
        for (const isTsumo of [false, true]) {
          let prev = 0;
          for (let han = 1; han <= 13; han++) {
            const current = total(
              calcScore({ han, fu: han >= 5 ? null : fu, isDealer, isTsumo })
                .payment
            );
            expect(current).toBeGreaterThanOrEqual(prev);
            prev = current;
          }
        }
      }
    }
  });
});

describe('calcScore（ルールの差し替え）', () => {
  it('切り上げ満貫なしなら 子30符4翻ロンは 7700', () => {
    // 1920 × 4 = 7680 → 7700
    const result = calcScore(
      { han: 4, fu: 30, isDealer: false, isTsumo: false },
      { ...MLEAGUE_RULES, kiriageMangan: false }
    );
    expect(result.payment).toEqual({ kind: 'ron', total: 7700 });
    expect(result.limit).toBeNull();
  });

  it('数え役満ありなら 子13翻ロンは 32000', () => {
    const result = calcScore(
      { han: 13, fu: null, isDealer: false, isTsumo: false },
      { ...MLEAGUE_RULES, kazoeYakuman: true }
    );
    expect(result.payment).toEqual({ kind: 'ron', total: 32000 });
    expect(result.limit).toBe('yakuman');
  });
});

describe('calcScore（入力の検証）', () => {
  it.each([
    { han: 0, fu: 30 },
    { han: 1.5, fu: 30 },
    { han: 2, fu: null },
    { han: 2, fu: 35 },
    { han: 2, fu: 10 },
  ])('不正な入力 $han翻 $fu符 は RangeError', ({ han, fu }) => {
    expect(() =>
      calcScore({ han, fu, isDealer: false, isTsumo: false })
    ).toThrow(RangeError);
  });
});

describe('calcScore（早見表の範囲を超える符）', () => {
  it('120符以上の手も計算できる（么九牌の暗槓が重なる手など）', () => {
    // 子 130符1翻 ロン: 130×8=1040 → ×4=4160 → 4200
    expect(
      calcScore({ han: 1, fu: 130, isDealer: false, isTsumo: false }).payment
    ).toEqual({ kind: 'ron', total: 4200 });
  });
});

describe('calcScore（切り上げ満貫の範囲: 公式ルール 第6章第4条・第6条）', () => {
  it('120符2翻は基本点が 1920 でも切り上げ満貫にならない（7700）', () => {
    // 120×16=1920 → ×4=7680 → 7700。切り上げ満貫は 30符4翻・60符3翻だけ
    const result = calcScore({
      han: 2,
      fu: 120,
      isDealer: false,
      isTsumo: false,
    });
    expect(result.payment).toEqual({ kind: 'ron', total: 7700 });
    expect(result.limit).toBeNull();
  });
});
