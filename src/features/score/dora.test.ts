import { describe, expect, it } from 'vitest';
import { testHand } from '@/features/hand/testHand';
import { parseTiles, tileName, type Tile } from '@/features/tiles/tile';
import { countDora, doraKindOf } from './dora';

const one = (notation: string): Tile => {
  const [tile] = parseTiles(notation);
  if (!tile) throw new Error(`牌がありません: ${notation}`);
  return tile;
};
const name = (kind: number) => tileName({ kind, red: false });

describe('doraKindOf（次順牌）', () => {
  it.each([
    ['1m', '二萬'],
    ['8p', '九筒'],
    ['9m', '一萬'],
    ['9s', '一索'],
    ['1z', '南'],
    ['4z', '東'],
    ['5z', '發'],
    ['6z', '中'],
    ['7z', '白'],
  ])('表示牌 %s → ドラ %s', (indicator, dora) => {
    expect(name(doraKindOf(one(indicator).kind))).toBe(dora);
  });
});

describe('countDora', () => {
  // 234m 567p 234s 56s + 88m、7s ロン（赤5を 1 枚含む）
  const hand = testHand('234m567p234s0s6s88m', '7s', { riichi: true });

  it('表ドラ・裏ドラ・赤ドラを別々に数える', () => {
    // 表示牌 7m → 8m が2枚。裏ドラ表示牌 1s → 2s が1枚。赤5s が1枚
    expect(countDora(hand, [one('7m')], [one('1s')])).toEqual({
      dora: 2,
      ura: 1,
      red: 1,
      total: 4,
    });
  });

  it('立直していなければ裏ドラは数えない', () => {
    const noRiichi = { ...hand, riichi: false };
    expect(countDora(noRiichi, [one('7m')], [one('1s')]).ura).toBe(0);
  });

  it('副露・槓子の中の牌も数え、同じドラが重なれば重ねて数える', () => {
    const kanHand = testHand('234p567s8m', '8m', {
      melds: [
        ['minkan', '5555m'],
        ['pon', '777z'],
      ],
    });
    // 表示牌 4m と槓ドラ表示牌 4m → 5m が4枚 × 2 = 8
    expect(countDora(kanHand, [one('4m'), one('4m')], []).dora).toBe(8);
  });
});
