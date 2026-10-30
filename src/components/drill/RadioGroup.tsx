import { LEGEND, TOGGLE_CHIP } from '@/components/ui/styles';

type Option<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  legend: string;
  name: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 並べ方。省略すると、選択肢を横一列に同じ幅で並べる */
  layoutClassName?: string;
};

/** ボタン風に並べたラジオボタンの組 */
export function RadioGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  layoutClassName = 'grid-flow-col auto-cols-fr',
}: Props<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={LEGEND}>{legend}</legend>
      <div className={`grid gap-2 ${layoutClassName}`}>
        {options.map((option) => (
          <label key={option.value} className={TOGGLE_CHIP}>
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
