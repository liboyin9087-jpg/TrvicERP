/**
 * Code Splitting Configuration
 * Optimizes bundle size by splitting code into smaller chunks
 */

import { defineConfig } from 'vite';

export const codeSplittingConfig = {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', '@hello-pangea/dnd'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'zustand', 'fuse.js'],
          
          // Feature chunks
          'admin': [/\/components\/admin\//],
          'staff': [/\/components\/staff\//],
          'client': [/\/components\/client\//],
          'dashboard': [/\/components\/dashboard\//],
          'shared': [/\/components\/shared\//],
          
          // Design system
          'design-system': [/\/src\/design-system\//],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB
  },
};
