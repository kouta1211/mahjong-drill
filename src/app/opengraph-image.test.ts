import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OG_TEXTS } from './opengraph-image';

describe('OGP 画像のフォント', () => {
  it('画像の文言の文字は、同梱したフォントの文字の一覧にすべて入っている', () => {
    // フォントは使う文字だけを含む。文言を変えて新しい文字が増えたら、
    // docs/features/design.md の手順でフォントと og-subset-chars.txt を作り直す
    const available = new Set(
      readFileSync(
        join(process.cwd(), 'src/app/fonts/og-subset-chars.txt'),
        'utf-8'
      )
    );
    const missing = [...Object.values(OG_TEXTS).join('')].filter(
      (ch) => ch !== ' ' && !available.has(ch)
    );
    expect(missing).toEqual([]);
  });
});
