import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    root: 'react',
    base: process.env.NODE_ENV === 'production' ? './' : '/',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        host: '127.0.0.1',
        port: 5173
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './react/src'),
        },
    }
})
