import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    allowedHosts: [
      "tma2.ddns.net",
      "void","VOID",
      "empty","EMPTY",
      ".attlocal.net",
      "localhost"
    ],
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // hmr: process.env.DISABLE_HMR !== 'true',
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    // Also ignore runtime-written data/log directories so writes from the server
    // (project saves, TTS request logs) don't trigger a reload mid-generation.
    watch: process.env.DISABLE_HMR === 'true' ? null : {
      ignored: ['**/data/**', '**/logs/**'],
    },
  },
}));
