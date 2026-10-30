import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * すべてのページに付けるセキュリティヘッダー。
 * スクリプトの読み込みを限定する本格的な CSP は、規模に見合わないので入れていない（2026-10-30 判断）。
 */
export const SECURITY_HEADERS = [
  // 他のサイトへの埋め込みを禁止する（クリックジャッキング対策）。新しいブラウザは CSP の方を優先する
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  // ファイルの種類をブラウザに推測させない
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 他のサイトへ移るときは、こちらの URL のうちドメインだけを渡す
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // 使わない機能を呼び出せないようにする
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },
  turbopack: {
    // 親ディレクトリにある無関係な package-lock.json を root と誤検出させない
    root: path.resolve(__dirname),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
