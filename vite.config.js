import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig({
    plugins: [
        react(),
        // Pre-compress assets (works with most static hosts)
        compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
        compression({
            algorithm: 'brotliCompress',
            ext: '.br',
            threshold: 1024,
        }),
    ],
    base: '/experiments/cyber-city/',
    server: {
        port: 3000,
        host: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        assetsDir: 'assets',
        // three is naturally large; bump the warning threshold
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;
                    // Split only the heaviest, well-isolated vendor: three.
                    // Everything else (drei + transitive deps + react) stays
                    // in default chunks to avoid circular-chunk warnings.
                    if (
                        id.includes('node_modules/three/') ||
                        id.includes('node_modules/three-')
                    ) {
                        return 'vendor-three';
                    }
                    if (
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/scheduler/')
                    ) {
                        return 'vendor-react';
                    }
                    return undefined;
                },
            },
        },
    },
});
