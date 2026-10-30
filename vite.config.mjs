import { defineConfig } from 'vite';
const proxy = { '/api': 'http://127.0.0.1:5050' };
export default defineConfig({
  root: 'public',
  publicDir: false,
  build: { outDir: '../dist', emptyOutDir: true },
  server: { proxy },
  preview: { proxy },
});
