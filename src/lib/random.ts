import type { Rng } from './rng';

/** 0 以上 n 未満の整数 */
export const randomInt = (n: number, rng: Rng) => Math.floor(rng() * n);

/** 配列から1つ選ぶ。空ならエラー */
export function pick<T>(items: readonly T[], rng: Rng): T {
  const item = items[randomInt(items.length, rng)];
  if (item === undefined) throw new Error('候補が空です');
  return item;
}

/** [値, 重み] の組から、重みに比例して1つ選ぶ（重みの合計は 1） */
export function weighted<T>(
  entries: readonly (readonly [T, number])[],
  rng: Rng
): T {
  let r = rng();
  for (const [value, w] of entries) {
    if (r < w) return value;
    r -= w;
  }
  const last = entries.at(-1);
  if (!last) throw new Error('重みが空です');
  return last[0];
}

/** 並びを混ぜた新しい配列を返す（Fisher–Yates） */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    const a = result[i];
    const b = result[j];
    if (a === undefined || b === undefined) continue;
    result[i] = b;
    result[j] = a;
  }
  return result;
}
