'use client';

import { useState } from 'react';
import { toYakuAnswer, type YakuAnswer } from '@/features/drill/yakuAnswer';
import { hanOf, YAKU, YAKU_IDS, type YakuId } from '@/features/yaku/yakuList';
import {
  ERROR_TEXT,
  LEGEND,
  PRIMARY_BUTTON,
  TOGGLE_CHIP,
} from '@/components/ui/styles';

type Props = {
  /** 門前かどうかで、選べる役と翻数が変わる */
  menzen: boolean;
  disabled: boolean;
  onAnswer: (answer: YakuAnswer) => void;
};

/** 役を翻数ごとに並べ、当てはまるものを選んで答える */
export function YakuPicker({ menzen, disabled, onAnswer }: Props) {
  const [selected, setSelected] = useState<YakuId[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 副露していて付かない役は出さない（翻数が null）
  const groups = new Map<number, YakuId[]>();
  for (const id of YAKU_IDS) {
    const han = hanOf(id, menzen);
    if (han === null) continue;
    groups.set(han, [...(groups.get(han) ?? []), id]);
  }
  const hanList = [...groups.keys()].sort((a, b) => a - b);

  const toggle = (id: YakuId) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (selected.length === 0) {
          setError('役を1つ以上選んでください');
          return;
        }
        setError(null);
        onAnswer(toYakuAnswer(selected, menzen));
      }}
    >
      {hanList.map((han) => (
        <fieldset key={han} disabled={disabled}>
          <legend className={LEGEND}>
            {han}翻{!menzen && '（副露）'}
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(groups.get(han) ?? []).map((id) => (
              <label key={id} className={TOGGLE_CHIP}>
                <input
                  type="checkbox"
                  checked={selected.includes(id)}
                  onChange={() => toggle(id)}
                  className="sr-only"
                />
                {YAKU[id].name}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && (
        <p role="alert" className={ERROR_TEXT}>
          {error}
        </p>
      )}
      <button type="submit" disabled={disabled} className={PRIMARY_BUTTON}>
        答える
        {selected.length > 0 && `（${toYakuAnswer(selected, menzen).han}翻）`}
      </button>
    </form>
  );
}
