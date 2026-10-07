/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev the browser talks only to Vite (same origin); /api and /ws are proxied to Spring Boot.
// That keeps the SameSite=Strict refresh cookie working and avoids CORS in development.
const backend = process.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: backend, changeOrigin: true },
      '/ws': { target: backend, changeOrigin: true, ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
