# Lv4 総合モード

手牌・和了条件（親子・場風・自風・ツモ/ロン・リーチ）・ドラ表示牌を見せて、支払う点数を答えるドリル。ドラの根拠は `docs/requirements.md` の 6 章（公式ルール 第2章第6条）。

## 構成

| 場所                                 | 役割                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `src/features/score/dora.ts`         | 表示牌 → ドラの種類（`doraKindOf`）と、手牌のドラの数（`countDora`。表・裏・赤を別々に） |
| `src/features/generate/scoreHand.ts` | Lv4 の生成（`generateScoreHand`）と、乱数を使わない点数計算（`scoreHand`）               |
| `src/features/drill/levels.ts`       | `createLv4Rounds`。点数を Lv1 の問題の形（`scoreQuestion`）にも直す                      |
| `src/components/drill/lv4View.tsx`   | 問題（手牌＋ドラ表示牌＋親子）と解説（役・ドラ → 符 → 点数）                             |
| `src/components/tiles/DoraView.tsx`  | ドラ表示牌・裏ドラ表示牌の表示                                                           |

## 決めたこと

- **ドラは役のあとに足す**: `analyzeHand`（役・高点法）の翻に、ドラの翻を足す。ドラの枚数はどの解釈でも同じなので、解釈の選び方は変わらない。役のない手は、ドラがあっても出題しない
- **表示牌は手牌と矛盾させない**: 手牌と、先に選んだ表示牌の枚数を引いた残りから選ぶ
  - 表示牌の枚数は、1 ＋ 槓の数
  - 裏ドラ表示牌は立直のときだけ、同じ枚数を付ける
- **親子は自風で決まる**（東家が親）。設定の「親・子」は Lv1 と共通の `seat`
- **答え・誤答・点数の解説は Lv1 の仕組みを使い回す**: 答えの型は `Payment`。4択は `generateChoices`、解説の点数部分は `explain` に `scoreQuestion` を渡す
- **共通の部品**:
  - 解説の表: `Breakdown.tsx`（符・役・ドラ）
  - 点数の数値入力: `PaymentAnswer.tsx`
  - 問題カード: `HandQuestionCard`。親子のバッジと、手牌の下に差し込む場所（`children`）を持つ
