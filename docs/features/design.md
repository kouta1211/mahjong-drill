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

## ホバー・押したときの反応

- `hover:` は Tailwind 4 では `@media (hover: hover)` の中でだけ効く。タッチ端末でホバーの色が残らないので、そのまま使ってよい
- ボタンのカーソルは、Tailwind 4 の既定では矢印。`globals.css` の `@layer base` で、押せるボタンを指の形に戻している
- 文字だけの副ボタンは `TEXT_BUTTON`、小さな枠付きボタンは `SMALL_BUTTON`（`src/components/ui/styles.ts`）。新しいボタンもどれかの型を使い、ホバー・押し込み・フォーカスの反応をそろえる
- 牌の形のもの（4択・設定のチップ）は、ホバーで下の厚みの色を変えない（`hover:border-x-*` と `hover:border-t-*` だけを変える）
- 見出しと大きな数字は明朝体（`font-display`、Shippori Mincho）
- 出題中の画面は、2026-10-30 に user が選んだデザイン案 A（https://claude.ai/artifact/RJQ1Tef99cEb3tLzxpZjYA）に合わせている。進み具合は卓の外のバー（`DrillSession` の `Progress`）、符・翻は数字を大きく単位を小さく、4択の単位（オール・-・符）も小さく出す（`ChoiceAnswer` の `ScoreText`）

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

## OGP 画像

`src/app/opengraph-image.tsx`（X 用の `twitter-image.tsx` は同じ画像を使う）。アイコンは `src/app/icon.svg`。

- 文字は Shippori Mincho。日本語のフォントを丸ごと同梱すると数 MB になるため、画像に使う文字だけを含むフォント（`src/app/fonts/ShipporiMincho-Bold-og-subset.ttf`）を同梱している。ライセンスは `src/app/fonts/OFL.txt`
- 含まれる文字は `src/app/fonts/og-subset-chars.txt`。画像の文言（`OG_TEXTS`）に一覧にない文字が入ると、`opengraph-image.test.ts` が落ちる
- **フォントの作り直し方**: `og-subset-chars.txt` に文字を足し、`https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&text=<文字をURLエンコード>` を curl で取得する。返ってきた CSS の `src: url(...)` の TrueType を、上のファイル名で置き換える（curl の既定の User-Agent なら TrueType が返る）
