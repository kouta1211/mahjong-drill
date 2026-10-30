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

// プレースホルダー: 公開前に文言を見直す
export const metadata: Metadata = {
  title: '麻雀点数計算ドリル',
  description: '段階的に麻雀の点数計算を練習できるドリル',
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
