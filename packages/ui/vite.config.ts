import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'steam-logo.webp',
        'controller-blueprint.webp',
        'og-image.png',
        'fw_images/**/*.bin',
      ],
      manifest: {
        name: 'Steam Controller Flash Tool',
        short_name: 'SC Flash',
        description: 'Unlock Bluetooth on your Steam Controller. Flash BLE firmware directly from your browser.',
        theme_color: '#0e141b',
        background_color: '#0e141b',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'steam-logo.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,bin}'],
        maximumFileSizeToCacheInBytes: 500000, // firmware files up to 500KB
      },
    }),
  ],
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
