# mahjong-drill

麻雀の点数計算を段階的に練習できるドリルアプリ（開発中）。

- 本番: https://mahjong-drill-phi.vercel.app
  - `mahjong-drill.vercel.app` は**別の人のアプリ**。`*.vercel.app` のサブドメインは全ユーザーで共有のため、このプロジェクトには `-phi` 付きのドメインが割り当てられた

## 牌画像

Tile images: [FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles) (CC0)。`public/tiles/` に同梱

## 技術スタック

- Next.js (App Router) + TypeScript（strict）
- Tailwind CSS v4
- ESLint + Prettier
- Vitest + Testing Library
- Husky + lint-staged（コミット時に eslint --fix / prettier）

## セットアップ

```bash
nvm use        # .nvmrc の Node.js に合わせる
npm install
npm run dev    # http://localhost:3000
```

## npm scripts

| コマンド                          | 内容                           |
| --------------------------------- | ------------------------------ |
| `npm run dev`                     | 開発サーバー                   |
| `npm run build`                   | 本番ビルド                     |
| `npm run lint`                    | ESLint                         |
| `npm run format` / `format:check` | Prettier で整形 / 整形チェック |
| `npm test` / `test:run`           | Vitest（watch / 1回実行）      |
