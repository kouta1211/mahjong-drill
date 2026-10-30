import { analyzeFu, type FuAnalysis } from '@/features/hand/analyzeFu';
import type { WinningHand } from '@/features/hand/types';
import { analyzeHand } from '@/features/yaku/analyzeHand';
import type { Rng } from '@/lib/rng';
import { buildHand, type HandFilters } from './buildHand';

export type GeneratedHand = {
  hand: WinningHand;
  analysis: Extract<FuAnalysis, { ok: true }>;
};

/**
 * Lv2 の出題に使える和了手を1つ作る。
 * 符が解釈によって変わらず（analyzeFu）、役があって役満でない（analyzeHand）手に限る。
 * 門前の手にはリーチを付け、役なしで捨てられる手を減らす。
 */
export function generateFuHand(filters: HandFilters, rng: Rng): GeneratedHand {
  const { hand, result } = buildHand(
    filters,
    { redFives: true, riichiRate: 1 },
    rng,
    (hand) => {
      const fu = analyzeFu(hand);
      return fu.ok && analyzeHand(hand).ok ? fu : null;
    }
  );
  return { hand, analysis: result };
}
