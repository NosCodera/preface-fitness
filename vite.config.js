import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from "@cloudflare/vite-plugin";
export default defineConfig({
  plugins: [react(), cloudflare()],
  base: './',
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: true } }
  }
});