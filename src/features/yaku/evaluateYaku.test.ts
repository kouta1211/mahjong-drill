import { describe, expect, it } from 'vitest';
import { interpretHand } from '@/features/hand/interpret';
import { testHand } from '@/features/hand/testHand';
import type { WinningHand } from '@/features/hand/types';
import { WIND } from '@/features/tiles/tile';
import { evaluateYaku, type YakuEvaluation } from './evaluateYaku';
import type { YakuId } from './yakuList';

// 期待値は、手牌を見て役を手で数えたもの。翻数は Mリーグ公式ルール 第9章の表。

/** すべての解釈を判定し、どれも同じ結果になることを確かめてから返す */
function only(hand: WinningHand): YakuEvaluation {
  const results = interpretHand(hand).map((it) => evaluateYaku(hand, it));
  const [first] = results;
  if (!first) throw new Error('和了形ではありません');
  const key = (r: YakuEvaluation) => JSON.stringify(r);
  if (results.some((r) => key(r) !== key(first))) {
    throw new Error(
      `解釈によって役が変わります: ${results.map(key).join(' / ')}`
    );
  }
  return first;
}

function yakuOf(hand: WinningHand): { ids: YakuId[]; han: number } {
  const result = only(hand);
  if (result.kind !== 'normal')
    throw new Error(`役満です: ${result.yakuman.join(',')}`);
  return { ids: result.yaku.map((y) => y.id).sort(), han: result.han };
}

const ids = (...list: YakuId[]) => [...list].sort();

describe('evaluateYaku（成立する手と、紛らわしい成立しない手）', () => {
  it.each([
    {
      name: '立直・門前ツモ・平和・断么九',
      hand: testHand('234m567p234s56s88m', '7s', {
        isTsumo: true,
        riichi: true,
      }),
      expected: ids('riichi', 'menzenTsumo', 'pinfu', 'tanyao'),
      han: 4,
    },
    {
      name: '嵌張待ちは平和にならない',
      hand: testHand('234m567p234s46s88m', '5s', { riichi: true }),
      expected: ids('riichi', 'tanyao'),
      han: 2,
    },
    {
      name: '一盃口（門前）',
      hand: testHand('223344m567p23s88m', '4s', { riichi: true }),
      expected: ids('riichi', 'pinfu', 'tanyao', 'iipeikou'),
      han: 4,
    },
    {
      name: '副露すると一盃口・平和は付かず、喰いタンだけ',
      hand: testHand('234m567p23s88m', '4s', { melds: [['chi', '234m']] }),
      expected: ids('tanyao'),
      han: 1,
    },
    {
      name: '双碰のツモで三暗刻',
      hand: testHand('222m555p88s345m99p', '8s', { isTsumo: true }),
      expected: ids('menzenTsumo', 'sanankou'),
      han: 3,
    },
    {
      name: '双碰のロンでは、ロンした刻子が明刻になり三暗刻にならない',
      hand: testHand('222m555p88s345m99p', '8s', { riichi: true }),
      expected: ids('riichi'),
      han: 1,
    },
    {
      name: '喰いタン（ポンとチー）',
      hand: testHand('678s44m67p', '8p', {
        melds: [
          ['pon', '555p'],
          ['chi', '234m'],
        ],
      }),
      expected: ids('tanyao'),
      han: 1,
    },
    {
      name: '副露の混一色・一気通貫・場風（1翻下がる）',
      hand: testHand('456m789m111z5m', '5m', { melds: [['chi', '123m']] }),
      expected: ids('honitsu', 'ittsu', 'roundWind'),
      han: 4,
    },
    {
      name: '七対子・断么九',
      hand: testHand('22m44m66m33p55p77s8s', '8s'),
      expected: ids('chiitoitsu', 'tanyao'),
      han: 3,
    },
    {
      name: '対々和・混老頭（全帯么九は付かない）',
      hand: testHand('111m999p11z55z', '1z', { melds: [['pon', '999s']] }),
      expected: ids('toitoi', 'honroutou', 'roundWind'),
      han: 5,
    },
    {
      name: '小三元と役牌2つ',
      hand: testHand('555z666z77z234m56p', '7p', { riichi: true }),
      expected: ids('riichi', 'haku', 'hatsu', 'shousangen'),
      han: 5,
    },
    {
      name: '三色同順・平和',
      hand: testHand('123m123p123s99m45s', '6s', { riichi: true }),
      expected: ids('riichi', 'sanshoku', 'pinfu'),
      han: 4,
    },
    {
      name: '連風牌（東場の東家の東）は 2翻の1つの役',
      hand: testHand('111z234m567p23s88s', '4s', {
        roundWind: WIND.east,
        seatWind: WIND.east,
      }),
      expected: ids('doubleWind'),
      han: 2,
    },
    {
      name: '全帯么九（門前）と場風',
      hand: testHand('123m789p111z99s78m', '9m'),
      expected: ids('chanta', 'roundWind'),
      han: 3,
    },
    {
      name: '純全帯么九・平和（門前）',
      // 78m は 6m・9m の両面待ちなので平和も付く
      hand: testHand('123m789p123s99s78m', '9m'),
      expected: ids('junchan', 'pinfu'),
      han: 4,
    },
  ])('$name', ({ hand, expected, han }) => {
    const result = yakuOf(hand);
    expect(result.ids).toEqual(expected);
    expect(result.han).toBe(han);
  });

  it('清一色は、どの解釈でも清一色だけが付く（混一色は付かない）', () => {
    const hand = testHand('123456789m234m5m', '5m', { riichi: true });
    for (const it of interpretHand(hand)) {
      const result = evaluateYaku(hand, it);
      if (result.kind !== 'normal') throw new Error('役満です');
      const got = result.yaku.map((y) => y.id);
      expect(got).toContain('chinitsu');
      expect(got).not.toContain('honitsu');
    }
  });

  it('役がない手は 0翻', () => {
    // 門前ロン・リーチなし・嵌張・么九牌あり
    expect(yakuOf(testHand('123m567p234s46s99m', '5s')).han).toBe(0);
  });
});

describe('evaluateYaku（役満は役満として返す）', () => {
  it.each([
    ['大三元', testHand('555z666z777z234m5p', '5p'), 'daisangen'],
    [
      '四暗刻（ツモの双碰）',
      testHand('111m999p11s55s777z', '5s', { isTsumo: true }),
      'suuankou',
    ],
    [
      '字一色',
      testHand('111z222z333z44z55z', '5z', { isTsumo: true }),
      'tsuuiisou',
    ],
  ])('%s', (_, hand, yakuman) => {
    const results = interpretHand(hand).map((it) => evaluateYaku(hand, it));
    expect(
      results.some(
        (r) => r.kind === 'yakuman' && r.yakuman.includes(yakuman as never)
      )
    ).toBe(true);
  });
});
