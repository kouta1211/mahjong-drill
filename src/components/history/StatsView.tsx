'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  levelStats,
  MIN_ATTEMPTS_FOR_WEAKNESS,
  weakTags,
} from '@/features/history/aggregate';
import {
  clearHistory,
  getHistorySnapshot,
  getServerHistorySnapshot,
  subscribeHistory,
} from '@/features/history/historyStore';
import type { Level } from '@/features/drill/types';
import {
  LEGEND,
  PANEL,
  PRIMARY_BUTTON,
  SMALL_BUTTON,
  TEXT_BUTTON,
} from '@/components/ui/styles';

const LEVEL_NAME: Record<Level, string> = {
  1: 'Lv1 早見表',
  2: 'Lv2 符計算',
  3: 'Lv3 役・翻',
  4: 'Lv4 総合',
};
const LEVELS: Level[] = [1, 2, 3, 4];
/** 苦手の一覧と履歴に出す件数 */
const WEAK_LIMIT = 8;
const RECENT_LIMIT = 10;

const dateFormat = new Intl.DateTimeFormat('ja-JP', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** 成績の画面。保存は端末内（localStorage）だけ */
export function StatsView({ onBack }: { onBack: () => void }) {
  const records = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot
  );
  const [confirming, setConfirming] = useState(false);
  const levels = levelStats(records);
  const weak = weakTags(records).slice(0, WEAK_LIMIT);

  return (
    <div className="mx-auto flex w-full flex-col gap-6 lg:max-w-3xl">
      <h2 className="font-display text-center text-2xl">成績</h2>

      {records.length === 0 ? (
        <p className="text-center text-muted">
          まだ記録がありません。ドリルを最後まで解くと、ここに成績がたまります。
        </p>
      ) : (
        <>
          <section aria-label="レベルごとの成績">
            <h3 className={LEGEND}>レベルごと</h3>
            <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {LEVELS.map((level) => {
                const s = levels.get(level);
                return (
                  <li key={level} className={`${PANEL} text-center`}>
                    <p className="text-sm text-muted">{LEVEL_NAME[level]}</p>
                    <p className="font-display text-3xl tabular-nums">
                      {s ? `${s.rate}%` : '—'}
                    </p>
                    <p className="text-xs text-muted">
                      {s ? `${s.sessions}回・${s.attempts}問` : '未挑戦'}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="苦手な分類">
            <h3 className={LEGEND}>
              苦手な分類（{MIN_ATTEMPTS_FOR_WEAKNESS}
              問以上解いたもの・正答率の低い順）
            </h3>
            {weak.length === 0 ? (
              <p className="text-sm text-muted">
                まだ判断できるほど解いていません。
              </p>
            ) : (
              <ol className={`${PANEL} flex flex-col gap-1 text-sm`}>
                {weak.map((s) => (
                  <li
                    key={`${s.level}|${s.tag}`}
                    className="flex items-center justify-between gap-3 tabular-nums"
                  >
                    <span>
                      <span className="mr-2 text-xs text-muted">
                        Lv{s.level}
                      </span>
                      {s.tag}
                    </span>
                    <span
                      className={s.rate < 60 ? 'font-semibold text-wrong' : ''}
                    >
                      {s.rate}%（{s.correct}/{s.attempts}）
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-label="直近の履歴">
            <h3 className={LEGEND}>直近の履歴</h3>
            <ul className={`${PANEL} flex flex-col gap-1 text-sm tabular-nums`}>
              {records.slice(0, RECENT_LIMIT).map((r) => {
                const correct = r.answers.filter((a) => a.correct).length;
                return (
                  <li key={r.id} className="flex justify-between gap-3">
                    <span>
                      {dateFormat.format(new Date(r.finishedAt))}　
                      {LEVEL_NAME[r.level]}
                    </span>
                    <span>
                      {correct} / {r.answers.length}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="text-center">
            {confirming ? (
              <p className="flex flex-wrap items-center justify-center gap-3 text-sm">
                成績をすべて消しますか？（元に戻せません）
                <button
                  type="button"
                  onClick={() => {
                    clearHistory();
                    setConfirming(false);
                  }}
                  className={`border-wrong! px-3 py-1 font-semibold text-wrong hover:bg-wrong/10 ${SMALL_BUTTON}`}
                >
                  消す
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className={`px-3 py-1 ${SMALL_BUTTON}`}
                >
                  やめる
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className={`text-sm text-muted ${TEXT_BUTTON}`}
              >
                成績を消す
              </button>
            )}
          </div>
        </>
      )}

      <p className="text-center text-xs text-muted">
        成績はこの端末のブラウザにだけ保存されます。
      </p>
      <button
        type="button"
        onClick={onBack}
        className={`md:mx-auto md:w-80 ${PRIMARY_BUTTON}`}
      >
        設定に戻る
      </button>
    </div>
  );
}
