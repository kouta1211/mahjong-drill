import { hanOf, YAKU, YAKU_IDS, type YakuId } from '@/features/yaku/yakuList';
import type { Rng } from '@/lib/rng';
import { shuffle } from '@/lib/random';

/** Lv3 の答え。正誤は役の組み合わせで決め、翻数は表示に使う */
export type YakuAnswer = { ids: YakuId[]; han: number };

const key = (a: YakuAnswer) => [...a.ids].sort().join(',');

export const isSameYaku = (a: YakuAnswer, b: YakuAnswer) => key(a) === key(b);

export function formatYaku(answer: YakuAnswer): string {
  const names = YAKU_IDS.filter((id) => answer.ids.includes(id)).map(
    (id) => YAKU[id].name
  );
  return `${names.join('・')}（${answer.han}翻）`;
}

/** 選んだ役から答えを作る。門前かどうかで翻数が変わる。付かない役は無視する */
export function toYakuAnswer(
  ids: readonly YakuId[],
  menzen: boolean
): YakuAnswer {
  const valid = ids.filter((id) => hanOf(id, menzen) !== null);
  return {
    ids: [...valid].sort(),
    han: valid.reduce((sum, id) => sum + (hanOf(id, menzen) ?? 0), 0),
  };
}

/** 間違えやすい役の組（入れ替えて誤答を作る） */
const CONFUSABLE: readonly (readonly [YakuId, YakuId])[] = [
  ['honitsu', 'chinitsu'],
  ['chanta', 'junchan'],
  ['iipeikou', 'ryanpeikou'],
  ['sanshoku', 'sanshokuDoukou'],
  ['toitoi', 'sanankou'],
  ['seatWind', 'roundWind'],
  ['pinfu', 'tanyao'],
];

/** 足して誤答を作るときの候補（よく付け忘れる・付けすぎる役） */
const ADDABLE: readonly YakuId[] = [
  'menzenTsumo',
  'pinfu',
  'tanyao',
  'iipeikou',
  'toitoi',
  'sanankou',
  'chanta',
  'honitsu',
  'ittsu',
  'sanshoku',
];

/**
 * 役の4択。誤答は正解から「1つ抜く」「1つ足す」「間違えやすい役と入れ替える」で作る。
 * どの誤答も、その手で付きうる役（門前かどうかを踏まえた翻数）だけでできている。
 */
export function generateYakuChoices(
  answer: YakuAnswer,
  menzen: boolean,
  rng: Rng
): YakuAnswer[] {
  const candidates: YakuAnswer[] = [];
  const push = (ids: YakuId[]) => {
    const next = toYakuAnswer(ids, menzen);
    if (next.ids.length > 0) candidates.push(next);
  };
  if (answer.ids.length > 1) {
    for (const id of answer.ids) push(answer.ids.filter((x) => x !== id));
  }
  for (const id of ADDABLE) {
    if (!answer.ids.includes(id)) push([...answer.ids, id]);
  }
  for (const [a, b] of CONFUSABLE) {
    if (answer.ids.includes(a) && !answer.ids.includes(b)) {
      push(answer.ids.map((x) => (x === a ? b : x)));
    }
    if (answer.ids.includes(b) && !answer.ids.includes(a)) {
      push(answer.ids.map((x) => (x === b ? a : x)));
    }
  }

  const unique = new Map<string, YakuAnswer>();
  for (const c of shuffle(candidates, rng)) {
    if (!isSameYaku(c, answer)) unique.set(key(c), c);
  }
  const wrong = [...unique.values()].slice(0, 3);
  if (wrong.length < 3) throw new Error('誤答を3つ作れませんでした');
  return shuffle([answer, ...wrong], rng);
}
