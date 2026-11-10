import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Geliştirmede /api istekleri `wrangler dev` (8787) sunucusuna gider.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
  build: { outDir: 'dist', sourcemap: false },
});
