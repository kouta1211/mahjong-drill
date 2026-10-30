import { describe, expect, it } from 'vitest';
import { generateScoreHand } from '@/features/generate/scoreHand';
import { parseTiles, WIND, type Tile } from '@/features/tiles/tile';
import { seededRng } from '@/lib/testRng';
import { calculate, type CalculatorInput } from './calculate';

const tiles = (n: string) => parseTiles(n);
const one = (n: string): Tile => {
  const [t] = parseTiles(n);
  if (!t) throw new Error(n);
  return t;
};

function input(
  concealed: string,
  win: string | null,
  extra: Partial<CalculatorInput> = {}
): CalculatorInput {
  return {
    concealed: tiles(concealed),
    melds: [],
    winTile: win === null ? null : one(win),
    isTsumo: false,
    roundWind: WIND.east,
    seatWind: WIND.south,
    riichi: false,
    indicators: [],
    uraIndicators: [],
    honba: 0,
    ...extra,
  };
}

describe('calculate（点数）', () => {
  it('立直・平和・断么九 + 表ドラ1 → 4翻30符 切り上げ満貫 8000（ドリルのテストと同じ手）', () => {
    const result = calculate(
      input('234m567p234s56s88m', '7s', {
        riichi: true,
        indicators: tiles('1s'),
      })
    );
    if (!result.ok || result.kind !== 'normal')
      throw new Error(JSON.stringify(result));
    expect(result.han).toBe(4);
    expect(result.payment).toEqual({ kind: 'ron', total: 8000 });
  });

  it('本場を足す（子 3900 の 2本場 → 4500）', () => {
    const result = calculate(
      input('234m567p234s56s88m', '7s', { riichi: true, honba: 2 })
    );
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.payment).toEqual({ kind: 'ron', total: 4500 });
  });

  it('ドリルで生成した手は、ドリルと同じ点数になる', () => {
    const rng = seededRng(51);
    const filters = {
      melds: 'any',
      win: 'both',
      includeChiitoi: true,
      seat: 'both',
    } as const;
    for (let i = 0; i < 100; i++) {
      const g = generateScoreHand(filters, rng);
      const result = calculate({
        concealed: g.hand.concealed,
        melds: g.hand.melds,
        winTile: g.hand.winTile,
        isTsumo: g.hand.isTsumo,
        roundWind: g.hand.roundWind,
        seatWind: g.hand.seatWind,
        riichi: g.hand.riichi,
        indicators: g.indicators,
        uraIndicators: g.uraIndicators,
        honba: 0,
      });
      if (!result.ok) throw new Error(result.errors.join(','));
      expect(result.payment).toEqual(g.score.payment);
    }
  });
});

describe('calculate（役満）', () => {
  it('大三元と字一色の複合は2倍（子のロン 64000）', () => {
    // 白發中の刻子・東のポン・南の単騎
    const result = calculate(
      input('555z666z777z2z', '2z', {
        melds: [{ type: 'pon', tiles: tiles('111z') }],
      })
    );
    if (!result.ok || result.kind !== 'yakuman')
      throw new Error(JSON.stringify(result));
    expect([...result.yakuman].sort()).toEqual(['daisangen', 'tsuuiisou']);
    expect(result.payment).toEqual({ kind: 'ron', total: 64000 });
  });

  it('親の大三元ツモは 16000オール', () => {
    const result = calculate(
      input('555z666z777z234m5p', '5p', { isTsumo: true, seatWind: WIND.east })
    );
    if (!result.ok || result.kind !== 'yakuman')
      throw new Error(JSON.stringify(result));
    expect(result.payment).toEqual({ kind: 'tsumoDealer', all: 16000 });
  });
});

describe('calculate（ドリルでは出題しない手には注記を付ける）', () => {
  it('双碰のロン', () => {
    const result = calculate(
      input('222m555p88s345m99p', '8s', { riichi: true })
    );
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.notes.join()).toContain('WRC');
  });

  it('暗槓を含む九蓮宝燈の形', () => {
    const result = calculate(
      input('2345679998m', '8m', {
        isTsumo: true,
        melds: [{ type: 'ankan', tiles: tiles('1111m') }],
      })
    );
    if (!result.ok) throw new Error(JSON.stringify(result));
    expect(result.kind).toBe('normal');
    expect(result.notes.join()).toContain('九蓮宝燈');
  });
});

describe('calculate（入力の誤り）', () => {
  it.each([
    [
      '和了牌がない',
      input('234m567p234s56s88m', null),
      '和了牌を選んでください',
    ],
    ['手牌が足りない', input('234m567p234s56s8m', '7s'), 'あと 1 枚足りません'],
    ['手牌が多い', input('234m567p234s56s888m', '7s'), '1 枚多すぎます'],
    ['同じ牌が5枚', input('1111m567p234s56s88m', '1m'), '5枚以上'],
    [
      '赤5索が2枚（手牌と和了牌）',
      input('234m567p234s0s6s88m', '0s'),
      '赤5は各色1枚まで',
    ],
    [
      '裏ドラ表示牌（立直なし）',
      input('234m567p234s56s88m', '7s', {
        indicators: tiles('1s'),
        uraIndicators: tiles('2s'),
      }),
      '立直しているときだけ',
    ],
    [
      'ドラ表示牌が多い',
      input('234m567p234s56s88m', '7s', { indicators: tiles('1s2s') }),
      'ドラ表示牌は 1 枚まで',
    ],
    [
      'チーが連続していない',
      input('567p234s56s88m', '7s', {
        melds: [{ type: 'chi', tiles: tiles('245m') }],
      }),
      '同じ色の連続した3枚',
    ],
    [
      'ポンが同じ牌でない',
      input('567p234s56s88m', '7s', {
        melds: [{ type: 'pon', tiles: tiles('223m') }],
      }),
      '同じ牌3枚',
    ],
    [
      '本場が範囲外',
      input('234m567p234s56s88m', '7s', { honba: -1 }),
      '本場は',
    ],
  ])('%s', (_, given, message) => {
    const result = calculate(given);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' / ')).toContain(message);
  });

  it.each([
    [
      '和了形でない',
      input('123m456p789s1234z', '5z'),
      '和了形になっていません',
    ],
    [
      '役がない（ドラだけ）',
      input('123m567p234s46s99m', '5s', { indicators: tiles('4s') }),
      '役がありません',
    ],
    ['国士無双', input('19m19p19s1234567z', '1m'), '国士無双'],
  ])('%s', (_, given, message) => {
    const result = calculate(given);
    expect(result).toEqual({
      ok: false,
      errors: [expect.stringContaining(message)],
    });
  });
});
