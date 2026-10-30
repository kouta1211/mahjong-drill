# 成績の保存と苦手分析

1回分のドリルを最後まで解くと、端末内（localStorage）に成績を保存する。設定画面の「成績を見る」から、レベルごとの正答率・苦手な分類・直近の履歴を見られる。ログインもサーバーも使わない。

## 構成

| 場所                                   | 役割                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `src/features/history/history.ts`      | 保存データの形・版番号・検証（`parseHistory`）・上限（`MAX_RECORDS`）            |
| `src/features/history/historyStore.ts` | localStorage の読み書き。React からは `useSyncExternalStore` で使う              |
| `src/features/history/aggregate.ts`    | レベルごとの集計と、苦手な分類（`weakTags`、`MIN_ATTEMPTS_FOR_WEAKNESS` 問以上） |
| `LevelView.tagsOf`（各 `lv*View.tsx`） | 1問ごとの分類。例: 子・ロン、待ち: 嵌張、役: 一気通貫、ドラあり                  |
| `src/components/history/StatsView.tsx` | 成績の画面                                                                       |

## 決めたこと

- **壊れたデータでも落ちない**: 保存データには版番号を付ける。読み込むときは1件ずつ形を確かめ、合わない記録だけを捨てる。版が違えば全部読み捨てる
- **localStorage が使えなくても動く**: プライベートブラウズや容量超過で例外が出ても、外には出さず「保存しない」だけにする
- **サーバーでの描画との食い違いを起こさない**: サーバーでは成績なし（`getServerHistorySnapshot`）として描き、ブラウザで読み直す。別のタブでの変更（`storage` イベント）にも追随する
- **1回分は1件だけ保存する**: `DrillSession` の保存の副作用は、`onFinish` が親の描画し直しのたびに新しくなるので何度も動きうる。`useRef` の目印で2回目以降を止める（テストあり）
- **成績を消すのは2段階**: 「成績を消す」→「消す」で確定する
- **テスト**: `vitest.setup.ts` で、テストごとに localStorage を消す
