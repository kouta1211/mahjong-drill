import { describe, expect, it } from 'vitest';
import nextConfig, { SECURITY_HEADERS } from './next.config';

describe('セキュリティヘッダー', () => {
  it('すべてのページに付ける', async () => {
    const rules = await nextConfig.headers?.();
    expect(rules).toEqual([{ source: '/(.*)', headers: SECURITY_HEADERS }]);
  });

  it.each([
    ['Content-Security-Policy', "frame-ancestors 'none'"],
    ['X-Frame-Options', 'DENY'],
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ])('%s: %s', (key, value) => {
    expect(SECURITY_HEADERS).toContainEqual({ key, value });
  });

  it('Permissions-Policy で、カメラ・マイク・位置情報を使えなくする', () => {
    const policy =
      SECURITY_HEADERS.find((h) => h.key === 'Permissions-Policy')?.value ?? '';
    for (const feature of ['camera=()', 'microphone=()', 'geolocation=()']) {
      expect(policy).toContain(feature);
    }
  });
});
