/**
 * 何度も使う見た目の型。色は globals.css のトークン（felt / wood / ivory など）だけを使う。
 */

const FOCUS =
  'focus-visible:ring-2 focus-visible:ring-felt-light focus-visible:outline-none';

/** 主な操作（はじめる・答える・もう一度）。木の板を押し込む見た目 */
export const PRIMARY_BUTTON = `rounded-xl border-b-4 border-wood-dark bg-wood py-3 text-lg font-semibold text-on-dark shadow-sm transition hover:brightness-110 active:translate-y-0.5 active:border-b-2 disabled:opacity-50 ${FOCUS}`;

/** 次の問題へ進む操作。卓の色 */
export const NEXT_BUTTON = `rounded-xl border-b-4 border-felt-deep bg-felt py-3 text-lg font-semibold text-on-dark shadow-sm transition hover:brightness-110 active:translate-y-0.5 active:border-b-2 ${FOCUS}`;

/** ラジオボタン・チェックボックスのラベル（中の input は sr-only）。点棒箱の札のような見た目 */
export const TOGGLE_CHIP =
  'cursor-pointer rounded-lg border border-line border-b-[3px] border-b-ivory-edge bg-ivory px-2 py-2 text-center text-sm transition has-checked:border-felt has-checked:bg-felt has-checked:text-on-dark has-focus-visible:ring-2 has-focus-visible:ring-felt-light has-disabled:cursor-default has-disabled:opacity-60';

/** 設定や役の一覧の見出し */
export const LEGEND = 'mb-2 text-sm font-medium text-muted';

/** 解説などを囲む枠 */
export const PANEL = 'rounded-xl border border-line bg-ivory p-3';

/** 入力欄 */
export const INPUT = `w-full rounded-xl border-2 border-line bg-ivory px-3 py-3 text-xl tabular-nums focus:border-felt focus:outline-none aria-invalid:border-wrong`;

/** エラーの文言 */
export const ERROR_TEXT = 'text-sm text-wrong';
