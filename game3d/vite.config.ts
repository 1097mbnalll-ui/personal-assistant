import { defineConfig } from 'vite';
// base './' so the build runs from any folder (GitHub Pages sub-path, Capacitor APK, file server)
export default defineConfig({ base: './', build: { target: 'es2022', chunkSizeWarningLimit: 8000 }, server: { host: true } });
