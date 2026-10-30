import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  countKinds,
  formatTiles,
  isSimple,
  isTerminal,
  isYaochu,
  kindOf,
  parseTiles,
  sortTiles,
  TILE_KIND_COUNT,
  tileImagePath,
  tileName,
  type Tile,
} from './tile';

describe('parseTiles / formatTiles', () => {
  it('表記を読み、同じ表記に戻せる', () => {
    const notation = '123m406p789s1157z';
    expect(formatTiles(parseTiles(notation))).toBe(notation);
  });

  it('0 は赤5', () => {
    expect(parseTiles('0m')).toEqual([{ kind: kindOf('m', 5), red: true }]);
  });

  it.each(['123', 'x', '8z', '0z', 'm'])('不正な表記 %s はエラー', (n) => {
    expect(() => parseTiles(n)).toThrow();
  });
});

describe('牌の分類', () => {
  it.each([
    ['5m', true, false, false],
    ['1p', false, true, true],
    ['9s', false, true, true],
    ['1z', false, false, true],
    ['7z', false, false, true],
  ])('%s: 中張=%s 老頭=%s 么九=%s', (n, simple, terminal, yaochu) => {
    const [tile] = parseTiles(n);
    if (!tile) throw new Error('牌がありません');
    expect(isSimple(tile.kind)).toBe(simple);
    expect(isTerminal(tile.kind)).toBe(terminal);
    expect(isYaochu(tile.kind)).toBe(yaochu);
  });
});

describe('sortTiles / countKinds', () => {
  it('種類順に並べ、枚数を数える', () => {
    const tiles = parseTiles('9s1m1z1m');
    expect(formatTiles(sortTiles(tiles))).toBe('11m9s1z');
    const counts = countKinds(tiles);
    expect(counts).toHaveLength(TILE_KIND_COUNT);
    expect(counts[kindOf('m', 1)]).toBe(2);
  });
});

describe('tileName / tileImagePath', () => {
  it.each([
    ['5m', '五萬', '/tiles/Man5.svg'],
    ['0p', '赤五筒', '/tiles/Pin5-Dora.svg'],
    ['9s', '九索', '/tiles/Sou9.svg'],
    ['1z', '東', '/tiles/Ton.svg'],
    ['6z', '發', '/tiles/Hatsu.svg'],
  ])('%s → %s / %s', (n, name, file) => {
    const [tile] = parseTiles(n);
    if (!tile) throw new Error('牌がありません');
    expect(tileName(tile)).toBe(name);
    expect(tileImagePath(tile)).toBe(file);
  });

  it('すべての牌の画像が public/tiles にある', () => {
    const all: Tile[] = [];
    for (let kind = 0; kind < TILE_KIND_COUNT; kind++)
      all.push({ kind, red: false });
    all.push(...parseTiles('0m0p0s'));
    for (const tile of all) {
      const file = path.join(process.cwd(), 'public', tileImagePath(tile));
      expect(existsSync(file), file).toBe(true);
    }
  });
});
