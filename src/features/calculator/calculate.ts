import type { Question } from '@/features/drill/types';
import type { FuResult } from '@/features/hand/calcFu';
import { interpretHand } from '@/features/hand/interpret';
import type { CalledMeld, WinningHand } from '@/features/hand/types';
import {
  calcScore,
  calcYakumanScore,
  type Payment,
  type ScoreResult,
} from '@/features/score/calcScore';
import { countDora, type DoraCount } from '@/features/score/dora';
import { addHonba } from '@/features/score/honba';
import {
  countKinds,
  isHonor,
  isYaochu,
  rankOf,
  suitOf,
  TILE_KIND_COUNT,
  WIND,
  type Tile,
  type Wind,
} from '@/features/tiles/tile';
import {
  hasConflictingYaku,
  isChuurenWithAnkan,
  rankInterpretations,
} from '@/features/yaku/analyzeHand';
import type { YakuHit } from '@/features/yaku/evaluateYaku';
import type { YakumanId } from '@/features/yaku/yakuList';

export type CalculatorInput = {
  /** 副露・暗槓以外の手牌（和了牌は含まない） */
  concealed: Tile[];
  melds: CalledMeld[];
  winTile: Tile | null;
  isTsumo: boolean;
  roundWind: Wind;
  seatWind: Wind;
  riichi: boolean;
  indicators: Tile[];
  uraIndicators: Tile[];
  honba: number;
};

export type CalculatorResult =
  | { ok: false; errors: string[] }
  | {
      ok: true;
      kind: 'yakuman';
      yakuman: YakumanId[];
      isDealer: boolean;
      payment: Payment;
      notes: string[];
    }
  | {
      ok: true;
      kind: 'normal';
      yaku: YakuHit[];
      dora: DoraCount;
      /** 役の翻 ＋ ドラの翻 */
      han: number;
      fu: FuResult;
      isDealer: boolean;
      score: ScoreResult;
      /** 本場を足した支払い */
      payment: Payment;
      /** 点数の解説（Lv1 の explain）に渡す形 */
      scoreQuestion: Question;
      notes: string[];
    };

/** 本場の入力の上限（それ以上は入力の誤りとみなす） */
export const MAX_HONBA_INPUT = 20;

const MELD_SIZE: Record<CalledMeld['type'], number> = {
  chi: 3,
  pon: 3,
  minkan: 4,
  ankan: 4,
};
const MELD_NAME: Record<CalledMeld['type'], string> = {
  chi: 'チー',
  pon: 'ポン',
  minkan: '明槓',
  ankan: '暗槓',
};

function meldError(meld: CalledMeld, index: number): string | null {
  const name = `${index + 1}つ目の副露（${MELD_NAME[meld.type]}）`;
  const size = MELD_SIZE[meld.type];
  if (meld.tiles.length !== size)
    return `${name}は${size}枚にしてください（今は${meld.tiles.length}枚）`;
  const kinds = meld.tiles.map((t) => t.kind).sort((a, b) => a - b);
  if (meld.type === 'chi') {
    const [a, b, c] = kinds;
    const ok =
      a !== undefined &&
      b === a + 1 &&
      c === a + 2 &&
      !isHonor(a) &&
      suitOf(a) === suitOf(c ?? a) &&
      rankOf(a) <= 7;
    return ok ? null : `${name}は、同じ色の連続した3枚にしてください`;
  }
  return kinds.every((k) => k === kinds[0])
    ? null
    : `${name}は、同じ牌${size}枚にしてください`;
}

/** 国士無双の形（么九牌13種そろい＋1枚）。対象外なので見分けて伝える */
function isKokushiShape(hand: WinningHand): boolean {
  if (hand.melds.length > 0) return false;
  const counts = countKinds([...hand.concealed, hand.winTile]);
  const yaochu = counts.flatMap((c, k) => (isYaochu(k) ? [c] : []));
  return (
    counts.every((c, k) => isYaochu(k) || c === 0) &&
    yaochu.every((c) => c >= 1) &&
    yaochu.reduce((a, b) => a + b, 0) === 14
  );
}

function validate(input: CalculatorInput): string[] {
  const errors: string[] = [];
  if (input.winTile === null) errors.push('和了牌を選んでください');

  input.melds.forEach((m, i) => {
    const e = meldError(m, i);
    if (e) errors.push(e);
  });

  const need = 13 - input.melds.length * 3;
  if (input.concealed.length < need) {
    errors.push(
      `手牌があと ${need - input.concealed.length} 枚足りません（和了牌を除いて ${need} 枚）`
    );
  } else if (input.concealed.length > need) {
    errors.push(
      `手牌が ${input.concealed.length - need} 枚多すぎます（和了牌を除いて ${need} 枚）`
    );
  }

  const allTiles = [
    ...input.concealed,
    ...(input.winTile ? [input.winTile] : []),
    ...input.melds.flatMap((m) => m.tiles),
    ...input.indicators,
    ...input.uraIndicators,
  ];
  const counts = countKinds(allTiles);
  for (let kind = 0; kind < TILE_KIND_COUNT; kind++) {
    if ((counts[kind] ?? 0) > 4) {
      errors.push('同じ牌が5枚以上あります（ドラ表示牌も含めて4枚まで）');
      break;
    }
  }
  for (const suit of ['m', 'p', 's'] as const) {
    const reds = allTiles.filter(
      (t) => t.red && !isHonor(t.kind) && suitOf(t.kind) === suit
    );
    if (reds.length > 1) errors.push('赤5は各色1枚までです');
  }

  const quads = input.melds.filter(
    (m) => m.type === 'minkan' || m.type === 'ankan'
  ).length;
  if (input.indicators.length > 1 + quads) {
    errors.push(`ドラ表示牌は ${1 + quads} 枚まで（1 ＋ 槓の数）です`);
  }
  if (!input.riichi && input.uraIndicators.length > 0) {
    errors.push('裏ドラ表示牌は、立直しているときだけ入れられます');
  }
  if (input.uraIndicators.length > input.indicators.length) {
    errors.push('裏ドラ表示牌は、ドラ表示牌と同じ枚数までです');
  }
  if (
    !Number.isInteger(input.honba) ||
    input.honba < 0 ||
    input.honba > MAX_HONBA_INPUT
  ) {
    errors.push(`本場は 0〜${MAX_HONBA_INPUT} で入力してください`);
  }
  return errors;
}

/**
 * 手牌と和了条件から点数を求める。入力の誤りは理由を返す。
 * ドリルでは出題しない手（双碰のロンなど）も計算し、注記を付ける。
 */
export function calculate(input: CalculatorInput): CalculatorResult {
  const errors = validate(input);
  if (errors.length > 0 || input.winTile === null) return { ok: false, errors };

  const hand: WinningHand = {
    concealed: input.concealed,
    melds: input.melds,
    winTile: input.winTile,
    isTsumo: input.isTsumo,
    roundWind: input.roundWind,
    seatWind: input.seatWind,
    riichi: input.riichi,
  };
  if (isKokushiShape(hand)) {
    return { ok: false, errors: ['国士無双は、この計算機の対象外です'] };
  }
  const interpretations = interpretHand(hand);
  if (interpretations.length === 0) {
    return {
      ok: false,
      errors: ['和了形になっていません（4面子1雀頭か七対子）'],
    };
  }

  const isDealer = input.seatWind === WIND.east;
  const notes: string[] = [];
  if (!hand.isTsumo && interpretations.some((it) => it.wait === 'shanpon')) {
    notes.push(
      '双碰待ちのロンで完成した刻子は、明刻として計算しています（WRC ルールの扱い。Mリーグの条文には記述がありません）'
    );
  }
  if (isChuurenWithAnkan(hand)) {
    notes.push(
      '暗槓を含む九蓮宝燈の形です。Mリーグの条文に記述がないため、九蓮宝燈（役満）にはしていません'
    );
  }

  const ranking = rankInterpretations(hand, interpretations);
  if (ranking.kind === 'yakuman') {
    const payment = addHonba(
      calcYakumanScore(ranking.yakuman.length, isDealer, hand.isTsumo),
      input.honba
    );
    return {
      ok: true,
      kind: 'yakuman',
      yakuman: ranking.yakuman,
      isDealer,
      payment,
      notes,
    };
  }
  if (ranking.kind === 'noYaku') {
    return { ok: false, errors: ['役がありません（ドラは役になりません）'] };
  }
  const [best] = ranking.top;
  if (!best)
    return { ok: false, errors: ['役がありません（ドラは役になりません）'] };
  if (hasConflictingYaku(ranking.top)) {
    notes.push('同じ点数になる別の解釈もあります。役の内訳はそのうちの1つです');
  }

  const dora = countDora(hand, input.indicators, input.uraIndicators);
  const han = best.han + dora.total;
  const fu = han >= 5 ? null : best.fu.fu;
  const score = calcScore({ han, fu, isDealer, isTsumo: hand.isTsumo });
  const payment = addHonba(score.payment, input.honba);
  return {
    ok: true,
    kind: 'normal',
    yaku: best.yaku,
    dora,
    han,
    fu: best.fu,
    isDealer,
    score,
    payment,
    scoreQuestion: {
      han,
      fu,
      isDealer,
      isTsumo: hand.isTsumo,
      honba: input.honba,
      answer: payment,
    },
    notes,
  };
}
