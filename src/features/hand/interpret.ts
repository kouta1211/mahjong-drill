import { countKinds, rankOf, type TileKind } from '@/features/tiles/tile';
import { decompose } from './decompose';
import type {
  ConcealedSet,
  Decomposition,
  Interpretation,
  WaitShape,
  WinningHand,
} from './types';

function sequenceWait(set: ConcealedSet, win: TileKind): WaitShape | null {
  const start = set.kind;
  if (win === start + 1) return 'kanchan';
  // 123 の 3 待ち、789 の 7 待ちは辺張
  if (win === start) return rankOf(start + 2) === 9 ? 'penchan' : 'ryanmen';
  if (win === start + 2) return rankOf(start) === 1 ? 'penchan' : 'ryanmen';
  return null;
}

/** 1つの分解について、和了牌を入れられる場所をすべて挙げる */
function interpretDecomposition(
  d: Decomposition,
  win: TileKind
): Interpretation[] {
  if (d.form === 'chiitoi') {
    return d.pairs.includes(win)
      ? [{ form: 'chiitoi', pairs: d.pairs, wait: 'tanki' }]
      : [];
  }
  const results: Interpretation[] = [];
  if (d.pair === win) {
    results.push({ ...d, wait: 'tanki', completedSetIndex: null });
  }
  d.sets.forEach((set, i) => {
    if (set.type === 'triplet') {
      if (set.kind === win)
        results.push({ ...d, wait: 'shanpon', completedSetIndex: i });
      return;
    }
    const wait = sequenceWait(set, win);
    if (wait) results.push({ ...d, wait, completedSetIndex: null });
  });
  return results;
}

/** 同じ解釈が重複しないようにするための鍵 */
function keyOf(it: Interpretation): string {
  if (it.form === 'chiitoi') return 'chiitoi';
  const sets = it.sets
    .map(
      (s, i) => `${s.type[0]}${s.kind}${i === it.completedSetIndex ? '*' : ''}`
    )
    .sort()
    .join(',');
  return `${it.pair}|${sets}|${it.wait}`;
}

/**
 * 和了手のすべての解釈（分解のしかた × 和了牌の入れ場所）を返す。
 * 和了形でなければ空配列。
 */
export function interpretHand(hand: WinningHand): Interpretation[] {
  const counts = countKinds([...hand.concealed, hand.winTile]);
  const setCount = 4 - hand.melds.length;
  const seen = new Set<string>();
  const results: Interpretation[] = [];
  for (const d of decompose(counts, setCount)) {
    for (const it of interpretDecomposition(d, hand.winTile.kind)) {
      const key = keyOf(it);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(it);
    }
  }
  return results;
}
