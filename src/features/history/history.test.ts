import { afterEach, describe, expect, it, vi } from 'vitest';
import { levelStats, MIN_ATTEMPTS_FOR_WEAKNESS, weakTags } from './aggregate';
import {
  appendRecord,
  HISTORY_KEY,
  HISTORY_VERSION,
  MAX_RECORDS,
  parseHistory,
  serializeHistory,
  type SessionRecord,
} from './history';
import { clearHistory, getHistorySnapshot, saveRecord } from './historyStore';

const record = (
  id: string,
  level: SessionRecord['level'],
  answers: SessionRecord['answers']
): SessionRecord => ({
  id,
  finishedAt: '2026-10-30T12:00:00.000Z',
  level,
  answers,
});

const ok = (...tags: string[]) => ({ correct: true, tags });
const ng = (...tags: string[]) => ({ correct: false, tags });

describe('parseHistory（壊れたデータに備える）', () => {
  const valid = record('a', 1, [ok('子・ロン')]);

  it('保存した形をそのまま読み戻せる', () => {
    expect(parseHistory(serializeHistory([valid]))).toEqual([valid]);
  });

  it.each([
    ['保存なし', null],
    ['JSON として読めない', '{壊れた'],
    [
      '版が違う',
      JSON.stringify({ version: HISTORY_VERSION + 1, records: [valid] }),
    ],
    [
      'records が配列でない',
      JSON.stringify({ version: HISTORY_VERSION, records: 'x' }),
    ],
    ['オブジェクトでない', '42'],
  ])('%s → 空', (_, raw) => {
    expect(parseHistory(raw)).toEqual([]);
  });

  it('形の合わない記録だけを捨てる', () => {
    const raw = JSON.stringify({
      version: HISTORY_VERSION,
      records: [
        valid,
        { ...valid, id: 'b', level: 9 },
        { ...valid, id: 'c', finishedAt: '日付でない' },
        { ...valid, id: 'd', answers: [] },
        { ...valid, id: 'e', answers: [{ correct: 'yes', tags: [] }] },
      ],
    });
    expect(parseHistory(raw).map((r) => r.id)).toEqual(['a']);
  });
});

describe('appendRecord', () => {
  it('新しい順に足し、上限を超えたら古いものから消す', () => {
    const many = Array.from({ length: MAX_RECORDS }, (_, i) =>
      record(`old${i}`, 1, [ok()])
    );
    const next = appendRecord(many, record('new', 2, [ok()]));
    expect(next).toHaveLength(MAX_RECORDS);
    expect(next[0]?.id).toBe('new');
    expect(next.some((r) => r.id === `old${MAX_RECORDS - 1}`)).toBe(false);
  });
});

describe('historyStore（localStorage）', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('保存すると読み出せ、消すと空になる', () => {
    expect(saveRecord(record('a', 3, [ok('役: 平和')]))).toBe(true);
    expect(getHistorySnapshot().map((r) => r.id)).toEqual(['a']);
    expect(localStorage.getItem(HISTORY_KEY)).not.toBeNull();
    expect(clearHistory()).toBe(true);
    expect(getHistorySnapshot()).toEqual([]);
  });

  it('同じ内容なら同じ配列を返す（useSyncExternalStore の無限更新を防ぐ）', () => {
    saveRecord(record('a', 1, [ok()]));
    expect(getHistorySnapshot()).toBe(getHistorySnapshot());
  });

  it('localStorage が例外を投げても、外には出さず保存しないだけ', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    expect(saveRecord(record('a', 1, [ok()]))).toBe(false);
    expect(getHistorySnapshot()).toEqual([]);
  });
});

describe('集計', () => {
  const records = [
    record('1', 1, [ok('子・ロン'), ng('子・ツモ'), ng('子・ツモ')]),
    record('2', 1, [ng('子・ツモ'), ok('子・ロン'), ok('子・ロン')]),
    record('3', 3, [ok('役: 平和'), ng('役: 一気通貫')]),
  ];

  it('レベルごとの回数と正答率', () => {
    const stats = levelStats(records);
    expect(stats.get(1)).toEqual({
      sessions: 2,
      attempts: 6,
      correct: 3,
      rate: 50,
    });
    expect(stats.get(3)).toEqual({
      sessions: 1,
      attempts: 2,
      correct: 1,
      rate: 50,
    });
    expect(stats.get(2)).toBeUndefined();
  });

  it(`苦手は正答率の低い順。回答が ${MIN_ATTEMPTS_FOR_WEAKNESS} 問未満の分類は出さない`, () => {
    expect(weakTags(records).map((s) => [s.tag, s.rate])).toEqual([
      ['子・ツモ', 0],
      ['子・ロン', 100],
    ]);
  });
});
