import type { Metadata } from 'next';
import { Geist, Geist_Mono, Shippori_Mincho } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// 見出し用。日本語の文字は subsets にないので preload せず、使う文字の分だけ読み込む
const shippori = Shippori_Mincho({
  variable: '--font-shippori',
  weight: '700',
  subsets: ['latin'],
  preload: false,
});

const SITE_URL = 'https://mahjong-drill-phi.vercel.app';
const DESCRIPTION =
  'Mリーグルール準拠の麻雀点数計算ドリル。早見表・符計算・役と翻・総合の4段階で、手牌から点数申告まで練習できます。';

export const metadata: Metadata = {
  // OGP 画像（opengraph-image.tsx）の URL を絶対 URL にするための基準
  metadataBase: new URL(SITE_URL),
  title: '麻雀点数計算ドリル — Mリーグルール準拠',
  description: DESCRIPTION,
  openGraph: {
    title: '麻雀点数計算ドリル',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: '麻雀点数計算ドリル',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '麻雀点数計算ドリル',
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${shippori.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
