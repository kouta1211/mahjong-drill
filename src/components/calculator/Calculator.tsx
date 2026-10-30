'use client';

import { useReducer } from 'react';
import {
  calculate,
  type CalculatorResult,
} from '@/features/calculator/calculate';
import { explain } from '@/features/drill/explain';
import { formatPayment } from '@/features/drill/payment';
import type { CalledMeld } from '@/features/hand/types';
import { WIND, tileName, type Wind } from '@/features/tiles/tile';
import { YAKUMAN } from '@/features/yaku/yakuList';
import { FuBreakdown, YakuBreakdown } from '@/components/drill/Breakdown';
import { RadioGroup } from '@/components/drill/RadioGroup';
import { LEGEND, PANEL, PRIMARY_BUTTON } from '@/components/ui/styles';
import {
  calculatorReducer,
  initialCalculatorState,
  isSameTarget,
  type Target,
} from './calculatorReducer';
import { TilePalette } from './TilePalette';
import { TileSlot } from './TileSlot';

const MELD_INFO: Record<CalledMeld['type'], { label: string; size: number }> = {
  chi: { label: 'チー', size: 3 },
  pon: { label: 'ポン', size: 3 },
  minkan: { label: '明槓', size: 4 },
  ankan: { label: '暗槓', size: 4 },
};
const MELD_TYPES: CalledMeld['type'][] = ['chi', 'pon', 'minkan', 'ankan'];

const windOptions = (winds: readonly Wind[]) =>
  winds.map((w) => ({ value: w, label: tileName({ kind: w, red: false }) }));

const ROUND_WIND_OPTIONS = windOptions([WIND.east, WIND.south]);
const SEAT_WIND_OPTIONS = windOptions(Object.values(WIND));
const WIN_OPTIONS = [
  { value: 'ron', label: 'ロン' },
  { value: 'tsumo', label: 'ツモ' },
] as const;
const RIICHI_OPTIONS = [
  { value: 'off', label: 'していない' },
  { value: 'on', label: 'している' },
] as const;
const HONBA_OPTIONS = [0, 1, 2, 3, 4].map((n) => ({
  value: n,
  label: `${n}本場`,
}));

function ResultPanel({ result }: { result: CalculatorResult }) {
  if (!result.ok) {
    return (
      <section aria-label="計算結果" aria-live="polite" className={PANEL}>
        <ul className="list-disc pl-5 text-sm text-muted">
          {result.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>
    );
  }
  const header = (
    <p className="text-center">
      <span className="text-sm text-muted">
        {result.isDealer ? '親' : '子'}
      </span>
      <span className="font-display ml-3 text-4xl tabular-nums">
        {formatPayment(result.payment)}
      </span>
    </p>
  );
  const notes = result.notes.length > 0 && (
    <ul className="list-disc pl-5 text-xs text-muted">
      {result.notes.map((n) => (
        <li key={n}>{n}</li>
      ))}
    </ul>
  );

  if (result.kind === 'yakuman') {
    return (
      <section
        aria-label="計算結果"
        aria-live="polite"
        className={`${PANEL} flex flex-col gap-3`}
      >
        {header}
        <p className="text-center font-semibold">
          {result.yakuman.map((id) => YAKUMAN[id]).join('・')}
          {result.yakuman.length > 1 && `（${result.yakuman.length}倍役満）`}
        </p>
        {notes}
      </section>
    );
  }

  const doraRows = [
    { label: 'ドラ', count: result.dora.dora },
    { label: '裏ドラ', count: result.dora.ura },
    { label: '赤ドラ', count: result.dora.red },
  ]
    .filter((r) => r.count > 0)
    .map((r) => ({ label: r.label, value: `${r.count}翻` }));
  return (
    <section
      aria-label="計算結果"
      aria-live="polite"
      className={`${PANEL} flex flex-col gap-4`}
    >
      {header}
      <YakuBreakdown
        yaku={result.yaku}
        extraRows={doraRows}
        totalHan={result.han}
      />
      {result.han < 5 && <FuBreakdown fu={result.fu} />}
      <ol className="list-decimal pl-5 text-sm">
        {explain(result.scoreQuestion).map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {notes}
    </section>
  );
}

/** 手牌を入力して点数を出す計算機 */
export function Calculator({ onBack }: { onBack: () => void }) {
  const [state, dispatch] = useReducer(
    calculatorReducer,
    initialCalculatorState
  );
  const result = calculate(state);
  const select = (target: Target) => dispatch({ type: 'select', target });
  const slot = (target: Target) => ({
    active: isSameTarget(state.target, target),
    onSelect: () => select(target),
    onRemove: (index: number) => dispatch({ type: 'remove', target, index }),
  });
  const need = 13 - state.melds.length * 3;

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-center text-2xl">点数計算機</h2>
        <TileSlot
          label="手牌"
          hint={`和了牌を除いて ${need} 枚`}
          tiles={state.concealed}
          {...slot('concealed')}
        />
        <TileSlot
          label="和了牌"
          hint="1枚"
          tiles={state.winTile ? [state.winTile] : []}
          {...slot('win')}
        />
        {state.melds.map((meld, i) => (
          <TileSlot
            key={i}
            label={`副露 ${i + 1}（${MELD_INFO[meld.type].label}）`}
            hint={`${MELD_INFO[meld.type].size}枚`}
            tiles={meld.tiles}
            {...slot({ meld: i })}
            action={
              <button
                type="button"
                onClick={() => dispatch({ type: 'removeMeld', index: i })}
                className="text-xs text-muted underline"
              >
                この副露を消す
              </button>
            }
          />
        ))}
        {state.melds.length < 4 && (
          <div>
            <p className={LEGEND}>副露を足す</p>
            <div className="grid grid-cols-4 gap-2">
              {MELD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => dispatch({ type: 'addMeld', meldType: type })}
                  className="rounded-lg border border-line border-b-[3px] border-b-ivory-edge bg-ivory py-2 text-sm"
                >
                  {MELD_INFO[type].label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TileSlot
            label="ドラ表示牌"
            tiles={state.indicators}
            {...slot('dora')}
          />
          <TileSlot
            label="裏ドラ表示牌"
            hint="立直のとき"
            tiles={state.uraIndicators}
            {...slot('ura')}
          />
        </div>
        {/* スマホ・タブレットでは画面の下に固定し、入れ先を選んだまま牌を押せるようにする */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-paper/95 px-4 py-2 backdrop-blur md:-mx-8 md:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <TilePalette onPick={(tile) => dispatch({ type: 'pick', tile })} />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <RadioGroup
            legend="場風"
            name="calc-round"
            options={ROUND_WIND_OPTIONS}
            value={state.roundWind}
            onChange={(v) =>
              dispatch({ type: 'setConditions', conditions: { roundWind: v } })
            }
          />
          <RadioGroup
            legend="和了"
            name="calc-win"
            options={WIN_OPTIONS}
            value={state.isTsumo ? 'tsumo' : 'ron'}
            onChange={(v) =>
              dispatch({
                type: 'setConditions',
                conditions: { isTsumo: v === 'tsumo' },
              })
            }
          />
        </div>
        <RadioGroup
          legend="自風（東が親）"
          name="calc-seat"
          options={SEAT_WIND_OPTIONS}
          value={state.seatWind}
          onChange={(v) =>
            dispatch({ type: 'setConditions', conditions: { seatWind: v } })
          }
        />
        <RadioGroup
          legend="立直"
          name="calc-riichi"
          options={RIICHI_OPTIONS}
          value={state.riichi ? 'on' : 'off'}
          onChange={(v) =>
            dispatch({
              type: 'setConditions',
              conditions: { riichi: v === 'on' },
            })
          }
        />
        <RadioGroup
          legend="本場"
          name="calc-honba"
          options={HONBA_OPTIONS}
          value={state.honba}
          onChange={(v) =>
            dispatch({ type: 'setConditions', conditions: { honba: v } })
          }
          layoutClassName="grid-cols-5"
        />
        <ResultPanel result={result} />
        <button
          type="button"
          onClick={() => dispatch({ type: 'reset' })}
          className="text-sm text-muted underline underline-offset-4"
        >
          入力をすべて消す
        </button>
        <button type="button" onClick={onBack} className={PRIMARY_BUTTON}>
          設定に戻る
        </button>
      </div>
    </div>
  );
}
