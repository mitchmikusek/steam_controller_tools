import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'ui',
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'tests/setup.ts')],
    globals: true,
  },
  resolve: {
    alias: {
      '@scflash/protocol': resolve(__dirname, '../protocol/src/index.ts'),
    },
  },
});
