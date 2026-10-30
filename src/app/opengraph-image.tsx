import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = '麻雀点数計算ドリル — Mリーグルール準拠';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 画像に使う文字だけを含む Shippori Mincho（SIL OFL。src/app/fonts/OFL.txt）。
// 含まれる文字の一覧は fonts/og-subset-chars.txt。作り直し方は docs/features/design.md
const fontData = readFile(
  join(process.cwd(), 'src/app/fonts/ShipporiMincho-Bold-og-subset.ttf')
);

/** 見せる手牌（2〜4萬・赤5〜7筒・3〜5索・中の刻子・白の対子） */
const HAND = [
  'Man2',
  'Man3',
  'Man4',
  'Pin5-Dora',
  'Pin6',
  'Pin7',
  'Sou3',
  'Sou4',
  'Sou5',
  'Chun',
  'Chun',
  'Chun',
  'Haku',
  'Haku',
];

const svgDataUri = async (name: string) => {
  const svg = await readFile(
    join(process.cwd(), 'public/tiles', `${name}.svg`)
  );
  return `data:image/svg+xml;base64,${svg.toString('base64')}`;
};

/** 画像に出す文言。文字を増やしたらフォントの作り直しが必要（opengraph-image.test.ts が検出する） */
export const OG_TEXTS = {
  title: '麻雀点数計算ドリル',
  subtitle: 'Mリーグルール準拠',
  levels: 'Lv1 早見表 / Lv2 符計算 / Lv3 役・翻 / Lv4 総合',
} as const;

const TILE_W = 60;
const TILE_H = 80;

export default async function Image() {
  const [font, front, ...faces] = await Promise.all([
    fontData,
    svgDataUri('Front'),
    ...HAND.map(svgDataUri),
  ]);

  return new ImageResponse(
    // 木目の縁
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: 28,
        background: 'linear-gradient(180deg, #a8703f, #7a4a24 45%, #4e2d14)',
      }}
    >
      {/* 緑のフェルト */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 24,
          background:
            'radial-gradient(ellipse at center, #2d7a4c 0%, #1f5e3a 60%, #154a2c 100%)',
          color: '#fbf7ee',
          fontFamily: 'Shippori Mincho',
        }}
      >
        <div style={{ fontSize: 84, letterSpacing: 6 }}>{OG_TEXTS.title}</div>
        <div style={{ marginTop: 12, fontSize: 32, opacity: 0.85 }}>
          {OG_TEXTS.subtitle}
        </div>
        <div style={{ display: 'flex', marginTop: 48 }}>
          {faces.map((face, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                width: TILE_W,
                height: TILE_H,
                marginLeft: i === 0 ? 0 : 4,
                display: 'flex',
              }}
            >
              {/* 牌の土台と面の2枚を重ねる（public/tiles は CC0）。
                  ImageResponse の中では next/image が使えないので <img> を使う */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={front}
                width={TILE_W}
                height={TILE_H}
                alt=""
                style={{ position: 'absolute' }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={face}
                width={TILE_W}
                height={TILE_H}
                alt=""
                style={{ position: 'absolute' }}
              />
            </div>
          ))}
        </div>
        <div
          style={{ display: 'flex', marginTop: 44, fontSize: 30, opacity: 0.9 }}
        >
          {OG_TEXTS.levels}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Shippori Mincho', data: font, weight: 700, style: 'normal' },
      ],
    }
  );
}
