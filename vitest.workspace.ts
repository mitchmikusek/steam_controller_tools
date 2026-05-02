import { defineWorkspace } from 'vitest/config';
import { resolve } from 'path';

export default defineWorkspace([
  {
    test: {
      name: 'protocol',
      root: resolve(__dirname, 'packages/protocol'),
      include: ['tests/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'ui',
      root: resolve(__dirname, 'packages/ui'),
      include: ['tests/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: [resolve(__dirname, 'packages/ui/tests/setup.ts')],
    },
    resolve: {
      alias: {
        '@scflash/protocol': resolve(__dirname, 'packages/protocol/src/index.ts'),
      },
    },
  },
]);
