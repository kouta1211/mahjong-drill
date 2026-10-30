import { CountUp } from '@/components/ui/CountUp';
import { PRIMARY_BUTTON } from '@/components/ui/styles';

export type ResultItem = {
  correct: boolean;
  /** 問題の要約（例: 子・ロン 30符 3翻） */
  label: string;
  given: string;
  answer: string;
};

type Props = {
  items: ResultItem[];
  onRestart: () => void;
};

export function ResultSummary({ items, onRestart }: Props) {
  const correctCount = items.filter((h) => h.correct).length;
  const rate =
    items.length === 0 ? 0 : Math.round((correctCount / items.length) * 100);
  const mistakes = items.filter((h) => !h.correct);

  return (
    <div className="mx-auto flex w-full flex-col gap-5 lg:max-w-3xl">
      <section aria-label="結果" className="text-center">
        {/* 数え上げは見た目だけ。読み上げには下の sr-only の文を使う */}
        <div aria-hidden>
          <p className="font-display text-6xl tabular-nums">
            <CountUp value={correctCount} />
            <span className="text-2xl text-muted"> / {items.length}</span>
          </p>
          <p className="mt-1 text-muted">
            正答率 <CountUp value={rate} />%
          </p>
        </div>
        <p className="sr-only">
          {items.length}問中 {correctCount}問正解
        </p>
        <p className="sr-only">正答率 {rate}%</p>
      </section>

      {mistakes.length > 0 ? (
        <section aria-label="間違えた問題">
          <h2 className="mb-2 font-semibold">間違えた問題</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {mistakes.map((item, i) => (
              <li
                key={i}
                className="rounded-xl border border-line bg-ivory px-3 py-2 text-sm tabular-nums"
              >
                <span className="font-medium">{item.label}</span>
                <span className="block text-muted">
                  あなた {item.given} → 正解{' '}
                  <strong className="text-ink">{item.answer}</strong>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-center font-semibold text-correct">全問正解です！</p>
      )}

      <button
        type="button"
        onClick={onRestart}
        className={`md:mx-auto md:w-80 ${PRIMARY_BUTTON}`}
      >
        もう一度
      </button>
    </div>
  );
}
