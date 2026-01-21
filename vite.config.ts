import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 4000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        // 自動更新模式：當有新版本時自動更新
        registerType: 'autoUpdate',
        // 啟用 PWA，使用自動生成的 service worker
        disable: false,
        // 避免 workbox/terser 在某些情況下報錯
        minify: false,
        // 使用自動生成 Service Worker（generateSW）
        strategies: 'generateSW',
        // 開發模式關閉 PWA
        devOptions: {
          enabled: false,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
          // 跳過等待，立即激活新版本
          skipWaiting: true,
          clientsClaim: true,
          // 清理舊緩存
          cleanupOutdatedCaches: true,
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
            // Supabase API 緩存策略
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5, // 5 分鐘
                },
              },
            },
          ],
        },
        manifest: {
          name: 'TrvicERP - 旅遊企業資源規劃系統',
          short_name: 'TrvicERP',
          description: '現代化的旅遊業 ERP 系統',
          theme_color: '#0d9488',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
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
    resolve: {
      // NOTE: Put more specific aliases first to avoid '@' catching them
      alias: {
        '@/components': path.resolve(__dirname, './components'),
        '@/core': path.resolve(__dirname, './src/core'),
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/types': path.resolve(__dirname, './src/core/types'),
        '@/store': path.resolve(__dirname, './src/store'),
        '@/data': path.resolve(__dirname, './src/data'),
        '@': path.resolve(__dirname, './src'),
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
