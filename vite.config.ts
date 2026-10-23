import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
export default defineConfig({
    plugins: [react()],
    build: {
        target: 'es2022',
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    metadata: ['exifreader'],
                    archive: ['jszip'],
                },
            },
        },
    },
})
