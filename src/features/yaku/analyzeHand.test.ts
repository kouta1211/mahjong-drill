import { describe, expect, it } from 'vitest';
import { testHand } from '@/features/hand/testHand';
import { analyzeHand } from './analyzeHand';

describe('analyzeHand（高点法: 第6章第5条）', () => {
  it('二盃口にも七対子にも取れる手は、点数の高い二盃口を採る', () => {
    // 二盃口3 + 断么九1 + 立直1 = 5翻（満貫） / 七対子2 + 断么九1 + 立直1 = 4翻25符
    const result = analyzeHand(
      testHand('223344m556677p8s', '8s', { riichi: true })
    );
    if (!result.ok) throw new Error(result.reason);
    expect(result.yaku.map((y) => y.id).sort()).toEqual([
      'riichi',
      'ryanpeikou',
      'tanyao',
    ]);
    expect(result.han).toBe(5);
  });

  it('三暗刻にも一盃口・平和にも取れる手は、符の高い三暗刻を採る', () => {
    // 111222333m の取り方で、どちらも3翻
    //   刻子3つ: 立直・三暗刻。20 + 門前ロン10 + 暗刻 1m8・2m4・3m4 = 46 → 50符
    //   順子3つ: 立直・一盃口・平和。30符
    const result = analyzeHand(
      testHand('111222333m45p99s', '6p', { riichi: true })
    );
    if (!result.ok) throw new Error(result.reason);
    expect(result.yaku.map((y) => y.id).sort()).toEqual(['riichi', 'sanankou']);
    expect(result.fu.fu).toBe(50);
  });
});

describe('analyzeHand（出題に使わない手）', () => {
  it.each([
    ['和了形でない', testHand('123m456p789s1234z', '5z'), 'notWinning'],
    [
      '双碰のロン',
      testHand('222m555p88s345m99p', '8s', { riichi: true }),
      'shanponRon',
    ],
    ['役がない', testHand('123m567p234s46s99m', '5s'), 'noYaku'],
    [
      '役満',
      testHand('555z666z777z234m5p', '5p', { isTsumo: true }),
      'yakuman',
    ],
  ])('%s', (_, hand, reason) => {
    expect(analyzeHand(hand)).toEqual({ ok: false, reason });
  });
});
