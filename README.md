# mahjong-drill

麻雀の点数計算を段階的に練習できるドリルアプリ（開発中）。

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
