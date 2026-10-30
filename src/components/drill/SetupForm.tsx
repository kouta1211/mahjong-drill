import {
  QUESTION_COUNTS,
  type AnswerMode,
  type DrillSettings,
  type Level,
  type MeldFilter,
  type RangeFilter,
  type SeatFilter,
  type WinFilter,
} from '@/features/drill/types';
import { RadioGroup } from './RadioGroup';
import { PRIMARY_BUTTON } from '@/components/ui/styles';

type Props = {
  settings: DrillSettings;
  onChange: (settings: DrillSettings) => void;
  onStart: () => void;
};

const LEVEL_OPTIONS = [
  { value: 1, label: 'Lv1 早見表' },
  { value: 2, label: 'Lv2 符計算' },
  { value: 3, label: 'Lv3 役・翻' },
  { value: 4, label: 'Lv4 総合' },
] as const satisfies readonly { value: Level; label: string }[];

const LEVEL_DESCRIPTION: Record<Level, string> = {
  1: '符と翻から点数を答えます',
  2: '手牌から符を答えます',
  3: '手牌から役と翻数を答えます',
  4: '手牌とドラから点数を答えます',
};

const MELD_OPTIONS = [
  { value: 'any', label: '鳴きあり' },
  { value: 'closedOnly', label: '門前のみ' },
] as const satisfies readonly { value: MeldFilter; label: string }[];

const CHIITOI_OPTIONS = [
  { value: 'on', label: '含める' },
  { value: 'off', label: '含めない' },
] as const;

// 「解説: あり / なし」と同じ名前にしないよう、言葉を変える（読み上げで区別できるように）
const HONBA_OPTIONS = [
  { value: 'off', label: '付けない' },
  { value: 'on', label: '付ける' },
] as const;

const SEAT_OPTIONS = [
  { value: 'both', label: '両方' },
  { value: 'nonDealer', label: '子' },
  { value: 'dealer', label: '親' },
] as const satisfies readonly { value: SeatFilter; label: string }[];

const WIN_OPTIONS = [
  { value: 'both', label: '両方' },
  { value: 'ron', label: 'ロン' },
  { value: 'tsumo', label: 'ツモ' },
] as const satisfies readonly { value: WinFilter; label: string }[];

const RANGE_OPTIONS = [
  { value: 'belowMangan', label: '満貫未満' },
  { value: 'all', label: '満貫以上も' },
] as const satisfies readonly { value: RangeFilter; label: string }[];

/** 4択以外の答え方の呼び方。Lv3 は数値ではなく役を選ぶ */
const modeOptions = (level: Level) =>
  [
    { value: 'choice', label: '4択' },
    { value: 'number', label: level === 3 ? '役を選ぶ' : '数値入力' },
  ] as const satisfies readonly { value: AnswerMode; label: string }[];

const EXPLANATION_OPTIONS = [
  { value: 'on', label: 'あり' },
  { value: 'off', label: 'なし' },
] as const;

const COUNT_OPTIONS = QUESTION_COUNTS.map((n) => ({
  value: n,
  label: `${n}問`,
}));

export function SetupForm({ settings, onChange, onStart }: Props) {
  const set = <K extends keyof DrillSettings>(
    key: K,
    value: DrillSettings[K]
  ) => onChange({ ...settings, [key]: value });

  return (
    <form
      className="mx-auto grid w-full gap-5 md:grid-cols-2 md:gap-x-8 lg:max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        onStart();
      }}
    >
      <div className="md:col-span-2">
        <RadioGroup
          legend="レベル"
          name="level"
          // 4つはスマホの1行に収まらないので 2×2 にする
          layoutClassName="grid-cols-2 md:grid-cols-4"
          options={LEVEL_OPTIONS}
          value={settings.level}
          onChange={(v) => set('level', v)}
        />
        <p className="mt-2 text-sm text-muted">
          {LEVEL_DESCRIPTION[settings.level]}
        </p>
      </div>
      <RadioGroup
        legend="出題数"
        name="count"
        options={COUNT_OPTIONS}
        value={settings.count}
        onChange={(v) => set('count', v)}
      />
      {/* 項目ごとに、使うレベルでだけ出す */}
      {(settings.level === 1 || settings.level === 4) && (
        <RadioGroup
          legend="親・子"
          name="seat"
          options={SEAT_OPTIONS}
          value={settings.seat}
          onChange={(v) => set('seat', v)}
        />
      )}
      {(settings.level === 1 || settings.level === 4) && (
        <RadioGroup
          legend="本場"
          name="honba"
          options={HONBA_OPTIONS}
          value={settings.honba ? 'on' : 'off'}
          onChange={(v) => set('honba', v === 'on')}
        />
      )}
      {settings.level === 1 && (
        <RadioGroup
          legend="点数の範囲"
          name="range"
          options={RANGE_OPTIONS}
          value={settings.range}
          onChange={(v) => set('range', v)}
        />
      )}
      {settings.level >= 2 && (
        <>
          <RadioGroup
            legend="鳴き"
            name="melds"
            options={MELD_OPTIONS}
            value={settings.melds}
            onChange={(v) => set('melds', v)}
          />
          <RadioGroup
            legend="七対子"
            name="includeChiitoi"
            options={CHIITOI_OPTIONS}
            value={settings.includeChiitoi ? 'on' : 'off'}
            onChange={(v) => set('includeChiitoi', v === 'on')}
          />
        </>
      )}
      <RadioGroup
        legend="和了"
        name="win"
        options={WIN_OPTIONS}
        value={settings.win}
        onChange={(v) => set('win', v)}
      />
      <RadioGroup
        legend="答え方"
        name="answerMode"
        options={modeOptions(settings.level)}
        value={settings.answerMode}
        onChange={(v) => set('answerMode', v)}
      />
      <RadioGroup
        legend="解説"
        name="showExplanation"
        options={EXPLANATION_OPTIONS}
        value={settings.showExplanation ? 'on' : 'off'}
        onChange={(v) => set('showExplanation', v === 'on')}
      />
      <button
        type="submit"
        className={`mt-2 md:col-span-2 md:mx-auto md:w-80 ${PRIMARY_BUTTON}`}
      >
        はじめる
      </button>
    </form>
  );
}
