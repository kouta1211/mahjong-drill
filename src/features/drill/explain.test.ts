import { describe, expect, it } from 'vitest';
import { calcScore } from '@/features/score/calcScore';
import { explain } from './explain';
import type { Question } from './types';

const q = (
  han: number,
  fu: number | null,
  isDealer: boolean,
  isTsumo: boolean
): Question => {
  const base = { han, fu, isDealer, isTsumo };
  return { ...base, answer: calcScore(base).payment };
};

describe('explain', () => {
  it('子 30符3翻 ロン', () => {
    expect(explain(q(3, 30, false, false))).toEqual([
      '基本点 = 30符 × 2^(3+2) = 960',
      '子のロン: 基本点 × 4 = 3840 → 100点単位に切り上げて 3900',
    ]);
  });

  it('切り上げ満貫は、そのことを書く', () => {
    expect(explain(q(4, 30, false, false))).toEqual([
      '基本点 = 30符 × 2^(4+2) = 1920',
      '切り上げ満貫で満貫。基本点は 2000',
      '子のロン: 基本点 × 4 = 8000',
    ]);
  });

  it('基本点が 2000 を超えると満貫', () => {
    expect(explain(q(3, 70, false, false))[1]).toBe(
      '2000 以上なので満貫。基本点は 2000'
    );
  });

  it('子のツモは子と親の支払いを分けて書く', () => {
    expect(explain(q(2, 20, false, true))).toEqual([
      '基本点 = 20符 × 2^(2+2) = 320',
      '子のツモ: 子2人が 基本点 = 320 → 100点単位に切り上げて 400 ずつ',
      '親は 基本点 × 2 = 640 → 100点単位に切り上げて 700',
    ]);
  });

  it('5翻以上は区分名から始める', () => {
    expect(explain(q(6, null, true, true))).toEqual([
      '6翻は跳満。基本点は 3000',
      '親のツモ: 子3人が 基本点 × 2 = 6000 ずつ（オール）',
    ]);
  });
});
