import {
  isHonor,
  rankOf,
  TILE_KIND_COUNT,
  type TileKind,
} from '@/features/tiles/tile';
import type { ConcealedSet, Decomposition } from './types';

/** counts から面子だけで全部を取り切る分け方を、すべて返す */
function extractSets(counts: number[]): ConcealedSet[][] {
  const first = counts.findIndex((c) => c > 0);
  if (first === -1) return [[]];

  const results: ConcealedSet[][] = [];
  const at = (k: number) => counts[k] ?? 0;

  // 一番小さい牌を含む面子は「刻子」か「その牌から始まる順子」しかない
  if (at(first) >= 3) {
    counts[first] = at(first) - 3;
    for (const rest of extractSets(counts)) {
      results.push([{ type: 'triplet', kind: first }, ...rest]);
    }
    counts[first] = at(first) + 3;
  }
  const canSequence =
    !isHonor(first) &&
    rankOf(first) <= 7 &&
    at(first + 1) > 0 &&
    at(first + 2) > 0;
  if (canSequence) {
    for (const k of [first, first + 1, first + 2]) counts[k] = at(k) - 1;
    for (const rest of extractSets(counts)) {
      results.push([{ type: 'sequence', kind: first }, ...rest]);
    }
    for (const k of [first, first + 1, first + 2]) counts[k] = at(k) + 1;
  }
  return results;
}

/**
 * 手の中の牌（和了牌を含む）を、和了形にするすべての分け方を返す。
 * setCount は手の中で作る面子の数（4 − 副露・暗槓の数）。
 * 七対子は副露がないとき（setCount === 4）だけ調べる。
 */
export function decompose(
  counts: readonly number[],
  setCount: number
): Decomposition[] {
  if (counts.length !== TILE_KIND_COUNT) {
    throw new RangeError(`counts の長さは ${TILE_KIND_COUNT} です`);
  }
  const total = counts.reduce((a, b) => a + b, 0);
  if (total !== setCount * 3 + 2) return [];

  const work = [...counts];
  const results: Decomposition[] = [];
  for (let pair: TileKind = 0; pair < TILE_KIND_COUNT; pair++) {
    if ((work[pair] ?? 0) < 2) continue;
    work[pair] = (work[pair] ?? 0) - 2;
    for (const sets of extractSets(work)) {
      results.push({ form: 'standard', pair, sets });
    }
    work[pair] = (work[pair] ?? 0) + 2;
  }

  // 同じ牌4枚を2組の対子とはみなさない
  if (setCount === 4 && counts.every((c) => c === 0 || c === 2)) {
    const pairs = counts.flatMap((c, kind) => (c === 2 ? [kind] : []));
    if (pairs.length === 7) results.push({ form: 'chiitoi', pairs });
  }
  return results;
}
