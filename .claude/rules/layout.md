# 画面を作る・変えるとき

このアプリは、スマホ・タブレット・PC のどれでも使う。スマホ用の細い列を、PC で中央に置くだけで済ませない。
対応するデバイスと、確かめる画面の幅は `docs/requirements.md` の 7 章が正。ここには写さない。

- 画面を変えたら、要件にある幅すべてで実際に表示して確かめる（Chrome DevTools MCP の `emulate` で幅を切り替える）
- ライトモードとダークモードの両方で確かめる（Chrome DevTools MCP の `emulate` の `colorScheme`）
- 色は `src/app/globals.css` のトークンだけを使う。トークンの意味は `docs/features/design.md`
