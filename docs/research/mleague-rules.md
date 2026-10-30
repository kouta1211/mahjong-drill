# Mリーグ ルール調査メモ（2026-10-30）

## 一次情報

- 公式ルール: https://m-league.jp/about/ （2026-10-30 はメンテナンス中で読めなかった）
- 保存版: https://web.archive.org/web/20260108090410/https://m-league.jp/about/ （2026-01-08 時点。条文と早見表を確認した）
  - WebFetch は web.archive.org を拒否し、`archive.org/wayback/available` API は 429 を返した。取得できたのは、`id_` を付けた URL を curl で直接開いたときだけだった
  - ページは UTF-8。端末に出すと文字化けするが、ファイル自体は壊れていない（`docs/lessons_learned.md` 参照）

確定した項目と条番号は `docs/requirements.md` の 6 章にまとめている。

## 二次情報との食い違い（記録）

- **異なる役満の複合**: 二次情報のうち [7][9] は「なし」と書いていたが、条文（第5章第4条・第6章第6条）は「あり」。[7][9] が誤り
- **110符1翻**: 公式の早見表では空欄。当初は出題対象に入れていたが、表との照合テストで見つけて除外した

## 公式で未確認の項目（二次情報のみ）

赤ドラ 3枚、喰いタン・後付けあり、流し満貫・人和なし。いずれも Lv1 の点数には影響しない。

## 二次情報の出典

- [1] Wikipedia「Mリーグ」 https://ja.wikipedia.org/wiki/M%E3%83%AA%E3%83%BC%E3%82%B0
- [2] Ｍリーグ公式ルール考 https://suzume.hakata21.com/1houg/56mlrule.html
- [3] janten.net https://janten.net/guide/m-league-rules
- [4] 麻雀格闘倶楽部Sp「Mリーグルール」 https://p.eagate.573.jp/game/mfc/mfc_sp/howto/mode/mleague/index.html
- [5] MLスタジアム https://ml-stadium.jp/rule/
- [6] pirorikin.blog https://pirorikin.blog/yakuman-in-m-league/
- [7] tsumoron.com https://tsumoron.com/articles/rules/mleague-rules-overview/
- [8] Yahoo!知恵袋 https://detail.chiebukuro.yahoo.co.jp/qa/question_detail/q12265215197
- [9] keiba-times.com https://keiba-times.com/m-league-rules-guide/
- [10] ABEMA TIMES（ダブル役満のチャンスを報じた記事） https://times.abema.tv/articles/-/7047004

## 教材での点検（2026-10-30）

Mリーグ公式ルールの保存版と、点数計算の教材（Wikipedia「麻雀の得点計算」「九蓮宝燈」「ドラ (麻雀)」。いずれも Mリーグ準拠をうたうものではないが、条文とは矛盾しない）で、エンジンの判定を点検した。出題中の問題の正解が変わる食い違いはなかった。見つかったものと対応:

- 切り上げ満貫の範囲: 「基本点 1920 なら満貫」としていたため、条文にない 120符2翻 も満貫になっていた → 30符4翻・60符3翻に限った
- 九蓮宝燈と暗槓: 暗槓を含む形も役満と判定していた。条文に記述がないため、要確認として出題から外す扱いを明示した
- 国士無双: 和了形の判定に含めていない → 範囲外として要件に明記

教材の間で割れていた項目: 連風牌の雀頭（4符とする教材もある。Mリーグは条文で2符）
