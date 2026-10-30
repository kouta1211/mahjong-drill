/**
 * 牌の種類は 0〜33 の番号で表す。
 *   0〜8: 萬子 1〜9 / 9〜17: 筒子 1〜9 / 18〜26: 索子 1〜9
 *   27〜30: 東南西北 / 31〜33: 白發中
 * 赤5 は種類ではなく、牌1枚ごとの印として持つ。
 */
export type TileKind = number;

export type Tile = { kind: TileKind; red: boolean };

export type Suit = 'm' | 'p' | 's' | 'z';

export const TILE_KIND_COUNT = 34;
const SUITS: readonly Suit[] = ['m', 'p', 's', 'z'];
const isSuit = (ch: string): ch is Suit =>
  (SUITS as readonly string[]).includes(ch);

export const WIND = { east: 27, south: 28, west: 29, north: 30 } as const;
export type Wind = (typeof WIND)[keyof typeof WIND];
export const DRAGONS = [31, 32, 33] as const;

export function suitOf(kind: TileKind): Suit {
  const suit = SUITS[Math.floor(kind / 9)];
  if (suit === undefined) throw new RangeError(`牌の番号が不正です: ${kind}`);
  return suit;
}

/** 数牌は 1〜9、字牌は 1〜7（東南西北白發中） */
export function rankOf(kind: TileKind): number {
  return (kind % 9) + 1;
}

export const isHonor = (kind: TileKind) => kind >= 27;
export const isTerminal = (kind: TileKind) =>
  !isHonor(kind) && (rankOf(kind) === 1 || rankOf(kind) === 9);
/** 么九牌（老頭牌・字牌） */
export const isYaochu = (kind: TileKind) => isHonor(kind) || isTerminal(kind);
/** 中張牌（数牌の 2〜8） */
export const isSimple = (kind: TileKind) => !isYaochu(kind);

export function kindOf(suit: Suit, rank: number): TileKind {
  const max = suit === 'z' ? 7 : 9;
  if (!Number.isInteger(rank) || rank < 1 || rank > max) {
    throw new RangeError(`牌の数字が不正です: ${rank}${suit}`);
  }
  return SUITS.indexOf(suit) * 9 + rank - 1;
}

/**
 * 一般的な表記の文字列を牌の配列にする。
 * 例: "123m456p0s11z" → 1萬2萬3萬 4筒5筒6筒 赤5索 東東。0 は赤5。
 */
export function parseTiles(notation: string): Tile[] {
  const tiles: Tile[] = [];
  let digits: string[] = [];
  for (const ch of notation.replace(/\s/g, '')) {
    if (/\d/.test(ch)) {
      digits.push(ch);
      continue;
    }
    if (!isSuit(ch) || digits.length === 0) {
      throw new SyntaxError(`牌の表記が不正です: ${notation}`);
    }
    const suit = ch;
    for (const d of digits) {
      const red = d === '0';
      if (red && suit === 'z') {
        throw new SyntaxError(`字牌に赤はありません: ${notation}`);
      }
      tiles.push({ kind: kindOf(suit, red ? 5 : Number(d)), red });
    }
    digits = [];
  }
  if (digits.length > 0) {
    throw new SyntaxError(`種類の文字がありません: ${notation}`);
  }
  return tiles;
}

/** 牌の配列を表記の文字列にする（parseTiles の逆。種類ごとにまとめる） */
export function formatTiles(tiles: readonly Tile[]): string {
  let out = '';
  let currentSuit: Suit | null = null;
  let digits = '';
  for (const t of tiles) {
    const suit = suitOf(t.kind);
    if (suit !== currentSuit && currentSuit !== null) {
      out += digits + currentSuit;
      digits = '';
    }
    currentSuit = suit;
    digits += t.red ? '0' : String(rankOf(t.kind));
  }
  return currentSuit === null ? '' : out + digits + currentSuit;
}

export function sortTiles(tiles: readonly Tile[]): Tile[] {
  return [...tiles].sort(
    (a, b) => a.kind - b.kind || Number(a.red) - Number(b.red)
  );
}

/** 種類ごとの枚数（長さ 34） */
export function countKinds(tiles: readonly Tile[]): number[] {
  const counts = new Array<number>(TILE_KIND_COUNT).fill(0);
  for (const t of tiles) counts[t.kind] = (counts[t.kind] ?? 0) + 1;
  return counts;
}

const HONOR_NAMES = ['東', '南', '西', '北', '白', '發', '中'] as const;
const SUIT_NAMES: Record<Exclude<Suit, 'z'>, string> = {
  m: '萬',
  p: '筒',
  s: '索',
};

/** 読み上げ・代替テキスト用の名前（例: 五萬、赤五筒、東） */
export function tileName(tile: Tile): string {
  const suit = suitOf(tile.kind);
  if (suit === 'z') return HONOR_NAMES[rankOf(tile.kind) - 1] ?? '';
  const num = '一二三四五六七八九'[rankOf(tile.kind) - 1] ?? '';
  return `${tile.red ? '赤' : ''}${num}${SUIT_NAMES[suit]}`;
}

const HONOR_FILES = [
  'Ton',
  'Nan',
  'Shaa',
  'Pei',
  'Haku',
  'Hatsu',
  'Chun',
] as const;
const SUIT_FILES: Record<Exclude<Suit, 'z'>, string> = {
  m: 'Man',
  p: 'Pin',
  s: 'Sou',
};

/** public/tiles/ の画像のパス（FluffyStuff/riichi-mahjong-tiles のファイル名） */
export function tileImagePath(tile: Tile): string {
  const suit = suitOf(tile.kind);
  const name =
    suit === 'z'
      ? HONOR_FILES[rankOf(tile.kind) - 1]
      : `${SUIT_FILES[suit]}${rankOf(tile.kind)}${tile.red ? '-Dora' : ''}`;
  return `/tiles/${name}.svg`;
}
