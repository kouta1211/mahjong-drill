/** 入力欄の文字列を数値として読んだ結果。読めなければ画面に出すエラーの文言 */
export type ParseResult =
  { ok: true; value: number } | { ok: false; error: string };

/** 前後の空白を除き、全角数字を半角にし、桁区切りのカンマを除く */
export function normalizeNumberInput(raw: string): string {
  return raw
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，]/g, '');
}
