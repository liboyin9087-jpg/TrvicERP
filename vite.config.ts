import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 4000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
          // Cache strategies for offline support
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/picsum\.photos\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
          ],
        },
        manifest: {
          name: 'TrvicERP',
          short_name: 'TrvicERP',
          description: '旅遊企業資源規劃系統',
          theme_color: '#0d9488',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: 'favicon.ico',
              sizes: '64x64 32x32 24x24 16x16',
              type: 'image/x-icon',
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './components'),
        '@/core': path.resolve(__dirname, './src/core'),
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/types': path.resolve(__dirname, './src/core/types'),
        '@/store': path.resolve(__dirname, './src/store'),
        '@/data': path.resolve(__dirname, './src/data'),
      },
    },
    optimizeDeps: {
      exclude: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
            'chart-vendor': ['recharts'],
            'pdf-vendor': ['@react-pdf/renderer'],
            // Feature chunks
            'admin': [
              './components/admin/ERPInsights',
              './components/admin/SessionManager',
              './components/admin/PaymentMonitor',
            ],
            'staff': [
              './components/staff/VisualPlanner',
              './components/staff/CustomerCDP',
              './components/staff/QuotationBuilder',
            ],
            'client': [
              './components/client/TravelerApp',
              './components/client/ItineraryView',
            ],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
