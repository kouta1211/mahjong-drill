/**
 * 点数計算に効くルールの値。
 * 根拠と要確認の項目は docs/requirements.md の 6 章（Mリーグルール準拠）を参照。
 */
export type ScoreRules = {
  /** 基本点が満貫の直前（子ロン 7700 相当）になる手を満貫に切り上げるか */
  kiriageMangan: boolean;
  /** 13翻以上を役満として扱うか。false なら三倍満で止める */
  kazoeYakuman: boolean;
};

export const MLEAGUE_RULES: ScoreRules = {
  kiriageMangan: true,
  kazoeYakuman: false,
};
