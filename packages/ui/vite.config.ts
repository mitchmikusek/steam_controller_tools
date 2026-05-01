import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@scflash/protocol': resolve(__dirname, '../protocol/src/index.ts'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
