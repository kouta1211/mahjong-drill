import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// globals: false では Testing Library の自動 cleanup が動かないため、明示的に呼ぶ
afterEach(() => {
  cleanup();
});
