/**
 * 役の一覧。Mリーグ公式ルール 第9章の表を写したもの（docs/requirements.md 6章）。
 * - closed: 門前での翻数 / open: 副露しているときの翻数（null は門前でなければ付かない「◎」の役）
 * - 「※」の役は副露すると1翻下がる
 * 一発・海底摸月・河底撈魚・搶槓・嶺上開花・ダブル立直は、手牌からは分からないため扱わない。
 */
export const YAKU = {
  menzenTsumo: { name: '門前清自摸和', closed: 1, open: null },
  riichi: { name: '立直', closed: 1, open: null },
  haku: { name: '役牌（白）', closed: 1, open: 1 },
  hatsu: { name: '役牌（發）', closed: 1, open: 1 },
  chun: { name: '役牌（中）', closed: 1, open: 1 },
  seatWind: { name: '役牌（自風）', closed: 1, open: 1 },
  roundWind: { name: '役牌（場風）', closed: 1, open: 1 },
  pinfu: { name: '平和', closed: 1, open: null },
  tanyao: { name: '断么九', closed: 1, open: 1 },
  iipeikou: { name: '一盃口', closed: 1, open: null },
  doubleWind: { name: '連風牌', closed: 2, open: 2 },
  toitoi: { name: '対々和', closed: 2, open: 2 },
  sanankou: { name: '三暗刻', closed: 2, open: 2 },
  sanshokuDoukou: { name: '三色同刻', closed: 2, open: 2 },
  sankantsu: { name: '三槓子', closed: 2, open: 2 },
  shousangen: { name: '小三元', closed: 2, open: 2 },
  honroutou: { name: '混老頭', closed: 2, open: 2 },
  sanshoku: { name: '三色同順', closed: 2, open: 1 },
  ittsu: { name: '一気通貫', closed: 2, open: 1 },
  chanta: { name: '全帯么九', closed: 2, open: 1 },
  chiitoitsu: { name: '七対子', closed: 2, open: null },
  ryanpeikou: { name: '二盃口', closed: 3, open: null },
  honitsu: { name: '混一色', closed: 3, open: 2 },
  junchan: { name: '純全帯么九', closed: 3, open: 2 },
  chinitsu: { name: '清一色', closed: 6, open: 5 },
} as const satisfies Record<
  string,
  { name: string; closed: number; open: number | null }
>;

export type YakuId = keyof typeof YAKU;

export const YAKU_IDS = Object.keys(YAKU) as YakuId[];

/** 手牌だけで判定できる役満。Lv3 では出題しないために判定する */
export const YAKUMAN = {
  suuankou: '四暗刻',
  daisangen: '大三元',
  tsuuiisou: '字一色',
  shousuushii: '小四喜',
  daisuushii: '大四喜',
  chinroutou: '清老頭',
  ryuuiisou: '緑一色',
  suukantsu: '四槓子',
  chuuren: '九蓮宝燈',
} as const;

export type YakumanId = keyof typeof YAKUMAN;

/** 門前かどうかで翻数を決める。副露していて付かない役なら null */
export function hanOf(id: YakuId, menzen: boolean): number | null {
  const yaku = YAKU[id];
  return menzen ? yaku.closed : yaku.open;
}
