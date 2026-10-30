'use client';

import { useState } from 'react';
import type { ParseResult } from '@/lib/parseNumber';

export type NumberField = { key: string; label: string; suffix?: string };

type Props<A> = {
  fields: NumberField[];
  /** 1欄ずつ読む。読めなければエラーの文言を返す */
  parse: (raw: string) => ParseResult;
  /** すべての欄が読めたら、答えの形にまとめる */
  toAnswer: (values: Record<string, number>) => A;
  disabled: boolean;
  onAnswer: (answer: A) => void;
};

export function NumberAnswer<A>({
  fields,
  parse,
  toAnswer,
  disabled,
  onAnswer,
}: Props<A>) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const parsed: Record<string, number> = {};
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const result = parse(values[field.key] ?? '');
      if (result.ok) parsed[field.key] = result.value;
      else nextErrors[field.key] = result.error;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onAnswer(toAnswer(parsed));
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
        className="rounded-xl bg-emerald-600 py-3 text-lg font-semibold text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none disabled:opacity-50"
      >
        答える
      </button>
    </form>
  );
}
