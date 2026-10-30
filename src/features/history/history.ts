import type { Level } from '@/features/drill/types';

/**
 * 成績の保存（端末内の localStorage）。ログインもサーバーも使わない。
 * 形が変わったら HISTORY_VERSION を上げる。違う版のデータは読み捨てる。
 */
export const HISTORY_VERSION = 1;
export const HISTORY_KEY = 'mahjong-drill:history';
/** 保存する回数の上限。超えたら古いものから消す */
export const MAX_RECORDS = 200;

export type AnswerRecord = {
  correct: boolean;
  /** 苦手分析の単位（例: 子・ロン、役: 一気通貫） */
  tags: string[];
};

export type SessionRecord = {
  id: string;
  /** 終えた日時（ISO 8601） */
  finishedAt: string;
  level: Level;
  answers: AnswerRecord[];
};

type Stored = { version: number; records: SessionRecord[] };

const isLevel = (v: unknown): v is Level =>
  v === 1 || v === 2 || v === 3 || v === 4;

const isAnswerRecord = (v: unknown): v is AnswerRecord =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as AnswerRecord).correct === 'boolean' &&
  Array.isArray((v as AnswerRecord).tags) &&
  (v as AnswerRecord).tags.every((t) => typeof t === 'string');

/** 保存データは他のコードや手で書き換えられうるので、1件ずつ形を確かめる */
export function isSessionRecord(v: unknown): v is SessionRecord {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as SessionRecord;
  return (
    typeof r.id === 'string' &&
    typeof r.finishedAt === 'string' &&
    !Number.isNaN(Date.parse(r.finishedAt)) &&
    isLevel(r.level) &&
    Array.isArray(r.answers) &&
    r.answers.length > 0 &&
    r.answers.every(isAnswerRecord)
  );
}

/**
 * 保存された文字列から成績を読む。壊れていても例外は投げず、読めた分だけ返す。
 * - JSON として読めない・版が違う → 空
 * - 形の合わない記録 → その記録だけ捨てる
 */
export function parseHistory(raw: string | null): SessionRecord[] {
  if (raw === null) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (typeof data !== 'object' || data === null) return [];
  const stored = data as Partial<Stored>;
  if (stored.version !== HISTORY_VERSION || !Array.isArray(stored.records))
    return [];
  return stored.records.filter(isSessionRecord);
}

/** 新しい記録を足し、上限を超えた古い記録を消した一覧を返す（新しい順） */
export function appendRecord(
  records: SessionRecord[],
  record: SessionRecord
): SessionRecord[] {
  return [record, ...records].slice(0, MAX_RECORDS);
}

export const serializeHistory = (records: SessionRecord[]): string =>
  JSON.stringify({ version: HISTORY_VERSION, records } satisfies Stored);
