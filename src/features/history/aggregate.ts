import type { Level } from '@/features/drill/types';
import type { SessionRecord } from './history';

export type Accuracy = { attempts: number; correct: number; rate: number };

export type TagStat = Accuracy & { level: Level; tag: string };

/** 苦手の一覧に出すのに必要な、最低限の回答数（少なすぎると偶然に左右される） */
export const MIN_ATTEMPTS_FOR_WEAKNESS = 3;

const rateOf = (correct: number, attempts: number) =>
  attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

/** レベルごとの回数（ドリルの回数）と、問題単位の正答率 */
export function levelStats(
  records: SessionRecord[]
): Map<Level, Accuracy & { sessions: number }> {
  const stats = new Map<Level, Accuracy & { sessions: number }>();
  for (const r of records) {
    const s = stats.get(r.level) ?? {
      sessions: 0,
      attempts: 0,
      correct: 0,
      rate: 0,
    };
    s.sessions += 1;
    s.attempts += r.answers.length;
    s.correct += r.answers.filter((a) => a.correct).length;
    s.rate = rateOf(s.correct, s.attempts);
    stats.set(r.level, s);
  }
  return stats;
}

/**
 * 分類ごとの正答率を、正答率の低い順（苦手が先）に返す。
 * 回答数が MIN_ATTEMPTS_FOR_WEAKNESS 未満の分類は出さない。
 * 正答率が同じなら、回答数の多い方を先にする（より確かな苦手）。
 */
export function weakTags(records: SessionRecord[]): TagStat[] {
  const stats = new Map<string, TagStat>();
  for (const r of records) {
    for (const a of r.answers) {
      for (const tag of a.tags) {
        const key = `${r.level}|${tag}`;
        const s = stats.get(key) ?? {
          level: r.level,
          tag,
          attempts: 0,
          correct: 0,
          rate: 0,
        };
        s.attempts += 1;
        if (a.correct) s.correct += 1;
        s.rate = rateOf(s.correct, s.attempts);
        stats.set(key, s);
      }
    }
  }
  return [...stats.values()]
    .filter((s) => s.attempts >= MIN_ATTEMPTS_FOR_WEAKNESS)
    .sort((a, b) => a.rate - b.rate || b.attempts - a.attempts);
}
