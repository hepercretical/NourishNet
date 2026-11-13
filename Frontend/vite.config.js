import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    fs: { allow: ['.', '../shared'] },
    port: 5173,
    strictPort: true,
    // Formatters can briefly truncate a file before rewriting it. Wait for the
    // completed write so HMR never caches an empty application module.
    watch: { awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 } },
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
  build: { sourcemap: false },
  test: {
    css: { include: /\.css/ },
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    clearMocks: true,
  },
});
