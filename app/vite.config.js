import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Host/port fixes for Tauri (doit matcher tauri.conf.json → build.devUrl)
const host = process.env.TAURI_DEV_HOST || '127.0.0.1';

export default defineConfig({
    plugins: [react()],
    root: 'react',
    clearScreen: false,
    base: './',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        host,
        port: 5173,
        strictPort: true,
        hmr: host
            ? {
                  protocol: 'ws',
                  host,
                  port: 5173,
              }
            : undefined,
        watch: {
            ignored: ['**/src-tauri/**'],
        },
    },
    envPrefix: ['VITE_', 'TAURI_'],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './react/src'),
        },
    },
});
