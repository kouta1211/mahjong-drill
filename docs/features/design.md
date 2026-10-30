# デザインとアニメーション

雀卓風のデザインと、要所だけのアニメーション（2026-10-30 に user が選んだ方針）。

## 色

色は `src/app/globals.css` のトークンだけで決め、部品では `bg-felt` や `text-ink` のような名前で使う。部品に色の値（`emerald-600` など）を直接書かない。

| トークン                           | 用途                                                           |
| ---------------------------------- | -------------------------------------------------------------- |
| `paper` / `ink` / `muted` / `line` | 背景・文字・補足の文字・区切り線                               |
| `ivory` / `ivory-edge`             | 4択のボタンや選択チップ（牌のような象牙色と、その下の厚み）    |
| `felt` 系 / `wood` 系              | 卓（`felt` ユーティリティ）と木目の縁（`wood` ユーティリティ） |
| `correct` / `wrong`                | 正誤の文字の色。ダークモードでは読みやすいよう明るくなる       |
| `correct-strong`                   | 正解のボタンの背景。モードで変わらない                         |
| `on-dark`                          | 卓・木・正解のボタンの上に乗る文字。**モードで変わらない**     |
| `gold`                             | 和了牌の強調                                                   |

- 見た目の型（主ボタン・次へ・選択チップ・入力欄など）は `src/components/ui/styles.ts` に定数としてまとめている
- 卓の枠は `TableFrame`、卓の上の札は `Badge`
- 見出しと大きな数字は明朝体（`font-display`、Shippori Mincho）

## アニメーション（`motion`）

| 場所            | 動き                                                    |
| --------------- | ------------------------------------------------------- |
| `DrillSession`  | 問題ごとに横へすべらせて入れ替える（`AnimatePresence`） |
| `HandView`      | 牌を左から順に置く。和了牌は少し間をおいて最後に置く    |
| `ChoiceAnswer`  | 正解は弾み、選んだ誤答は揺れる                          |
| `Feedback`      | 正誤と解説を下から出す                                  |
| `ResultSummary` | 正答数・正答率を数え上げる（`CountUp`）                 |

- `Drill` を `MotionConfig reducedMotion="user"` で包み、OS の「視差効果を減らす」に従う。`CountUp` はその設定のとき数え上げずに最終の値を出す
- 数え上げの数字は `aria-hidden` にし、読み上げには最終の値を書いた `sr-only` の文を使う
- テストでは `vitest.setup.ts` の `MotionGlobalConfig.skipAnimations` でアニメーションを止める
