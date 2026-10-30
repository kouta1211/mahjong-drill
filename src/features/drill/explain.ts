import { calcScore, ceil100, type LimitName } from '@/features/score/calcScore';
import type { Question } from './types';

const LIMIT_LABEL: Record<LimitName, string> = {
  mangan: '満貫',
  haneman: '跳満',
  baiman: '倍満',
  sanbaiman: '三倍満',
  yakuman: '役満',
};

const rounded = (raw: number) => {
  const value = ceil100(raw);
  return raw === value ? `${value}` : `${raw} → 100点単位に切り上げて ${value}`;
};

/** 解説を、計算の手順ごとの文の配列で返す */
export function explain(question: Question): string[] {
  const { han, fu, isDealer, isTsumo } = question;
  const { rawBasePoints, basePoints, limit } = calcScore(question);
  const steps: string[] = [];

  if (rawBasePoints === null) {
    const label = limit === null ? '' : LIMIT_LABEL[limit];
    steps.push(`${han}翻は${label}。基本点は ${basePoints}`);
  } else {
    steps.push(`基本点 = ${fu}符 × 2^(${han}+2) = ${rawBasePoints}`);
    if (limit === 'mangan') {
      steps.push(
        rawBasePoints >= basePoints
          ? `${basePoints} 以上なので満貫。基本点は ${basePoints}`
          : `切り上げ満貫で満貫。基本点は ${basePoints}`
      );
    }
  }

  if (!isTsumo) {
    const rate = isDealer ? 6 : 4;
    steps.push(
      `${isDealer ? '親' : '子'}のロン: 基本点 × ${rate} = ${rounded(basePoints * rate)}`
    );
  } else if (isDealer) {
    steps.push(
      `親のツモ: 子3人が 基本点 × 2 = ${rounded(basePoints * 2)} ずつ（オール）`
    );
  } else {
    steps.push(`子のツモ: 子2人が 基本点 = ${rounded(basePoints)} ずつ`);
    steps.push(`親は 基本点 × 2 = ${rounded(basePoints * 2)}`);
  }
  return steps;
}
