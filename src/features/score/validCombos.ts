import { FU_VALUES } from './calcScore';

/** 早見表で出題する翻の上限。これ以上は点数が変わらない */
export const MAX_DRILL_HAN = 13;

export type Combo = {
  han: number;
  fu: number | null;
  isTsumo: boolean;
};

/**
 * 実際の和了でありえる符・翻・ツモロンの組み合わせか。
 * - 20符はピンフツモのみ: ロン不可、ツモは2翻以上
 * - 25符は七対子のみ: 2翻以上、ツモは門前ツモが付くので3翻以上
 * - 110符1翻は Mリーグ公式の早見表で空欄（officialTable.test.ts で照合）
 */
export function isPossibleCombo({ han, fu, isTsumo }: Combo): boolean {
  if (han >= 5) return fu === null;
  if (fu === 20) return isTsumo && han >= 2;
  if (fu === 25) return han >= (isTsumo ? 3 : 2);
  if (fu === 110) return han >= 2;
  return fu !== null;
}

/** 出題に使う組み合わせの一覧。5翻以上は符を持たない */
export function listPossibleCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const isTsumo of [false, true]) {
    for (let han = 1; han <= MAX_DRILL_HAN; han++) {
      const fus = han >= 5 ? [null] : FU_VALUES;
      for (const fu of fus) {
        const combo = { han, fu, isTsumo };
        if (isPossibleCombo(combo)) combos.push(combo);
      }
    }
  }
  return combos;
}
