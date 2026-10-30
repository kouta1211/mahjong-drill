'use client';

import { useState } from 'react';
import type { Payment } from '@/features/score/calcScore';
import { parsePoints } from '@/features/drill/payment';

type Props = {
  /** 答える形式。正解の種類から決まる */
  kind: Payment['kind'];
  disabled: boolean;
  onAnswer: (payment: Payment) => void;
};

type Field = { key: string; label: string; suffix?: string };

const FIELDS: Record<Payment['kind'], Field[]> = {
  ron: [{ key: 'total', label: 'ロンの点数' }],
  tsumoDealer: [{ key: 'all', label: '子1人あたりの支払い', suffix: 'オール' }],
  tsumoNonDealer: [
    { key: 'fromNonDealer', label: '子の支払い' },
    { key: 'fromDealer', label: '親の支払い' },
  ],
};

export function NumberAnswer({ kind, disabled, onAnswer }: Props) {
  const fields = FIELDS[kind];
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const parsed: Record<string, number> = {};
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const result = parsePoints(values[field.key] ?? '');
      if (result.ok) parsed[field.key] = result.value;
      else nextErrors[field.key] = result.error;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const get = (key: string) => parsed[key] ?? 0;
    switch (kind) {
      case 'ron':
        onAnswer({ kind, total: get('total') });
        break;
      case 'tsumoDealer':
        onAnswer({ kind, all: get('all') });
        break;
      case 'tsumoNonDealer':
        onAnswer({
          kind,
          fromNonDealer: get('fromNonDealer'),
          fromDealer: get('fromDealer'),
        });
        break;
    }
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {fields.map((field, i) => {
        const errorId = `${field.key}-error`;
        const error = errors[field.key];
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <label
              htmlFor={field.key}
              className="text-sm text-zinc-600 dark:text-zinc-400"
            >
              {field.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                id={field.key}
                inputMode="numeric"
                autoComplete="off"
                autoFocus={i === 0}
                disabled={disabled}
                value={values[field.key] ?? ''}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                aria-invalid={error !== undefined}
                aria-describedby={error ? errorId : undefined}
                className="w-full rounded-xl border-2 border-zinc-300 px-3 py-3 text-xl tabular-nums focus:border-emerald-600 focus:outline-none aria-invalid:border-rose-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
              {field.suffix && <span className="shrink-0">{field.suffix}</span>}
            </div>
            {error && (
              <p
                id={errorId}
                className="text-sm text-rose-600 dark:text-rose-400"
              >
                {error}
              </p>
            )}
          </div>
        );
      })}
      <button
        type="submit"
        disabled={disabled}
        className="rounded-xl bg-emerald-600 py-3 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
      >
        答える
      </button>
    </form>
  );
}
