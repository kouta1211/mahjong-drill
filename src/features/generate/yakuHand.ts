import type { WinningHand } from '@/features/hand/types';
import { analyzeHand, type HandAnalysis } from '@/features/yaku/analyzeHand';
import type { Rng } from '@/lib/rng';
import { buildHand, type HandFilters } from './buildHand';

/** 門前の手にリーチを付ける割合。役がリーチだけの手に偏らないよう 1 より小さくする */
const RIICHI_RATE = 0.6;

export type GeneratedYakuHand = {
  hand: WinningHand;
  analysis: Extract<HandAnalysis, { ok: true }>;
};

/** Lv3 の出題に使える和了手を1つ作る。ドラ（赤5）は混ぜない */
export function generateYakuHand(
  filters: HandFilters,
  rng: Rng
): GeneratedYakuHand {
  const { hand, result } = buildHand(
    filters,
    { redFives: false, riichiRate: RIICHI_RATE },
    rng,
    (hand) => {
      const analysis = analyzeHand(hand);
      return analysis.ok ? analysis : null;
    }
  );
  return { hand, analysis: result };
}
