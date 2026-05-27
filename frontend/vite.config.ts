import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            src: path.resolve(__dirname, 'src')
        }
    },
    plugins: [react()],
    server: {
        port: 5173
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.ts'
    }
});
