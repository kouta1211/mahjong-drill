import { describe, expect, it } from 'vitest';
import { WIND } from '@/features/tiles/tile';
import { calcFu } from './calcFu';
import { interpretHand } from './interpret';
import { testHand } from './testHand';
import type { WinningHand } from './types';

// 期待値は Mリーグ公式ルール 第6章第3条の規則から手で計算している。
//   副底20 / 門前ロン+10 / ツモ+2（ピンフツモを除く） / 辺張・嵌張・単騎+2 / 役牌の雀頭+2
//   刻子: 中張 明2 暗4、么九 明4 暗8 / 槓子: 中張 明8 暗16、么九 明16 暗32
//   合計を 10符単位に切り上げ。副露した平和形のロンは +10

function onlyFu(hand: WinningHand) {
  const its = interpretHand(hand);
  const [it] = its;
  if (!it || its.length !== 1)
    throw new Error(`解釈が1つではありません: ${its.length}`);
  return calcFu(hand, it);
}

describe('calcFu', () => {
  it.each([
    {
      // 平和ツモ: 20（ツモ符なし）
      name: '平和ツモ',
      hand: testHand('234m567p234s56s88m', '7s', { isTsumo: true }),
      raw: 20,
      fu: 20,
    },
    {
      // 平和ロン: 20 + 門前ロン10 = 30
      name: '平和ロン',
      hand: testHand('234m567p234s56s88m', '7s'),
      raw: 30,
      fu: 30,
    },
    {
      // 20 + 嵌張2 + 門前ロン10 = 32 → 40
      name: '嵌張の門前ロン',
      hand: testHand('234m567p234s46s88m', '5s'),
      raw: 32,
      fu: 40,
    },
    {
      // 喰い平和形のロン: 20 + 10 = 30
      name: '副露した平和形のロン',
      hand: testHand('567p234s56s88m', '7s', { melds: [['chi', '234m']] }),
      raw: 30,
      fu: 30,
    },
    {
      // 喰い平和形のツモ: 20 + ツモ2 = 22 → 30
      name: '副露した平和形のツモ',
      hand: testHand('567p234s56s88m', '7s', {
        melds: [['chi', '234m']],
        isTsumo: true,
      }),
      raw: 22,
      fu: 30,
    },
    {
      // 七対子は 25 固定
      name: '七対子',
      hand: testHand('1133m5577p22s116z', '6z'),
      raw: 25,
      fu: 25,
    },
    {
      // 20 + 双碰ロンで完成した 888m は明刻（中張）2 + 門前ロン10 = 32 → 40
      name: '双碰のロン（中張牌）',
      hand: testHand('234m567p789s55p88m', '8m'),
      raw: 32,
      fu: 40,
    },
    {
      // 20 + ツモで完成した 888m は暗刻（中張）4 + ツモ2 = 26 → 30
      name: '双碰のツモ（中張牌）',
      hand: testHand('234m567p789s55p88m', '8m', { isTsumo: true }),
      raw: 26,
      fu: 30,
    },
    {
      // 20 + 暗槓1m（么九）32 + 雀頭 中2 + 門前ロン10 = 64 → 70
      name: '么九牌の暗槓',
      hand: testHand('234p567p45s77z', '3s', { melds: [['ankan', '1111m']] }),
      raw: 64,
      fu: 70,
    },
    {
      // 20 + 明槓5p（中張）8 + ポン東（么九）4 + 嵌張2 = 34 → 40
      name: '明槓とポン（副露のロン）',
      hand: testHand('234m79s88m', '8s', {
        melds: [
          ['minkan', '5555p'],
          ['pon', '111z'],
        ],
      }),
      raw: 34,
      fu: 40,
    },
    {
      // 20 + 暗刻 中（么九）8 + 単騎2 + ツモ2 = 32 → 40
      name: '么九牌の暗刻と単騎のツモ',
      hand: testHand('234m567p777z789s1p', '1p', { isTsumo: true }),
      raw: 32,
      fu: 40,
    },
  ])('$name: $raw → $fu符', ({ hand, raw, fu }) => {
    const result = onlyFu(hand);
    expect(result.rawFu).toBe(raw);
    expect(result.fu).toBe(fu);
  });

  it('連風牌の雀頭は 4符ではなく 2符', () => {
    // 東場の東家。20 + 雀頭 東2 + 単騎2 + 門前ロン10 = 34
    const hand = testHand('234m567p345s678s1z', '1z', {
      roundWind: WIND.east,
      seatWind: WIND.east,
    });
    expect(onlyFu(hand).rawFu).toBe(34);
  });

  it('客風牌の雀頭は 0符', () => {
    // 東場の南家で、雀頭が北。20 + 単騎2 + 門前ロン10 = 32
    const hand = testHand('234m567p345s678s4z', '4z');
    expect(onlyFu(hand).rawFu).toBe(32);
  });

  it('平和形でも雀頭が役牌なら平和にならず、ツモ符が付く', () => {
    // 20 + 雀頭 白2 + ツモ2 = 24 → 30
    const result = onlyFu(
      testHand('234m567p234s56s55z', '7s', { isTsumo: true })
    );
    expect(result.isPinfu).toBe(false);
    expect(result.fu).toBe(30);
  });

  it('内訳の合計は rawFu と一致する', () => {
    const result = onlyFu(
      testHand('234p567p45s77z', '3s', { melds: [['ankan', '1111m']] })
    );
    expect(result.items.reduce((s, i) => s + i.fu, 0)).toBe(result.rawFu);
  });
});
