import {
  appendRecord,
  HISTORY_KEY,
  parseHistory,
  serializeHistory,
  type SessionRecord,
} from './history';

/**
 * 成績を localStorage に読み書きする窓口。React からは useSyncExternalStore で使う。
 * localStorage が使えない環境（プライベートブラウズ、容量超過など）では、
 * 保存しないだけで例外は外に出さない（ドリルは保存なしで動く）。
 */
type Listener = () => void;

const listeners = new Set<Listener>();
const EMPTY: SessionRecord[] = [];
/** 同じ内容なら同じ配列を返す（useSyncExternalStore は参照で変化を判断するため） */
let cache: { raw: string | null; records: SessionRecord[] } | null = null;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(): string | null {
  try {
    return storage()?.getItem(HISTORY_KEY) ?? null;
  } catch {
    return null;
  }
}

function notify() {
  cache = null;
  for (const listener of listeners) listener();
}

export function getHistorySnapshot(): SessionRecord[] {
  const raw = readRaw();
  if (cache === null || cache.raw !== raw)
    cache = { raw, records: parseHistory(raw) };
  return cache.records;
}

/** サーバーでの描画とハイドレーションのときは、成績なしとして描く */
export const getServerHistorySnapshot = (): SessionRecord[] => EMPTY;

export function subscribeHistory(listener: Listener): () => void {
  listeners.add(listener);
  // 別のタブで成績が変わったときにも追随する
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === HISTORY_KEY) notify();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** 記録を保存する。保存できたら true */
export function saveRecord(record: SessionRecord): boolean {
  try {
    const s = storage();
    if (!s) return false;
    s.setItem(
      HISTORY_KEY,
      serializeHistory(appendRecord(getHistorySnapshot(), record))
    );
    notify();
    return true;
  } catch {
    return false;
  }
}

export function clearHistory(): boolean {
  try {
    const s = storage();
    if (!s) return false;
    s.removeItem(HISTORY_KEY);
    notify();
    return true;
  } catch {
    return false;
  }
}
