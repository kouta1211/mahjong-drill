import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach } from 'vitest';

// テストではアニメーションを待たずに、最後の状態にする
MotionGlobalConfig.skipAnimations = true;

// globals: false では Testing Library の自動 cleanup が動かないため、明示的に呼ぶ
afterEach(() => {
  cleanup();
  // 成績の保存（localStorage）を次のテストに持ち越さない
  localStorage.clear();
});
