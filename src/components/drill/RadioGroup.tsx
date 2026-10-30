type Option<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  legend: string;
  name: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** ボタン風に並べたラジオボタンの組 */
export function RadioGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {legend}
      </legend>
      <div className="grid grid-flow-col auto-cols-fr gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="cursor-pointer rounded-lg border border-zinc-300 px-2 py-2 text-center text-sm transition-colors has-checked:border-emerald-600 has-checked:bg-emerald-600 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-emerald-400 dark:border-zinc-700"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
