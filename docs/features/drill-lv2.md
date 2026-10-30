# Lv2 符計算モード

手牌と和了条件（場風・自風・ツモ/ロン・リーチ）を見せて、符を答えるドリル。符の規則は `docs/requirements.md` の 6 章。

## 構成

| 場所                                | 役割                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `src/features/tiles/tile.ts`        | 牌の型（種類 0〜33 ＋ 赤5 の印）、`"123m0p11z"` 形式の表記、画像のパス |
| `src/features/hand/decompose.ts`    | 手の中の牌を「雀頭＋面子」「七対子」のすべての形に分解する             |
| `src/features/hand/interpret.ts`    | 分解 × 和了牌の入れ場所（待ちの形）＝「解釈」をすべて挙げる            |
| `src/features/hand/calcFu.ts`       | 解釈ごとの符と内訳。部分符の表は条文どおり                             |
| `src/features/hand/analyzeFu.ts`    | 出題に使える手かの判定と、その符                                       |
| `src/features/hand/generateHand.ts` | 面子から手牌を組み立て、出題に使える手だけを返す                       |
| `src/features/drill/session.ts`     | Lv1・Lv2 共通の「出題中 → 結果」の状態遷移                             |
| `src/components/drill/lv2View.tsx`  | Lv2 の問題・解説・数値入力の欄                                         |
| `src/components/tiles/`             | 牌（`Tile`）と手牌全体（`HandView`）の表示                             |

## 決めたこと

- **手牌は面子から組み立てる**。ただし正解は、組み立てたときの意図ではなく、出来上がった手牌をエンジンで分解し直して求める
- **出題しない手**（`analyzeFu`）:
  - 解釈によって符が変わる手
  - 双碰待ちのロン。ロンで完成した刻子の扱いを公式で確かめられていないため
- **役なしの手を出さない**（役の判定は Lv3 で作る）:
  - 門前の手はリーチを付ける
  - 副露した手は、役牌の刻子か断么九に限る
- **牌画像**: `public/tiles/`（FluffyStuff/riichi-mahjong-tiles、CC0）。面と土台の2枚の SVG を CSS の背景として重ねる。暗槓の両端は牌の背（`Back.svg`、赤い背の柄）
- **牌の大きさ**: `HandView` が、1行に並ぶ牌の数から CSS 変数 `--tw` を決める。手牌と副露が1行に収まらなければ、副露を次の行に回す
- **レベルごとの違い**: `LevelView`（`DrillSession.tsx`）にまとめる。状態遷移・4択・数値入力・結果画面は Lv1 と共通
