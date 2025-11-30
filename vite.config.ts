import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  envPrefix: 'VITE_',

  build: {
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: 'terser',
    cssCodeSplit: true, // Split CSS for better caching
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2, // Run terser twice for better compression
      },
      mangle: {
        safari10: true, // Fix Safari 10 bugs
      },
    },
    // Let Vite handle chunk splitting to avoid loader order issues
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit since we're using lazy loading
    reportCompressedSize: false, // Faster builds
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-is',
      'prop-types',
      'recharts',
      '@supabase/supabase-js',
      'leaflet',
      'react-leaflet',
      'lottie-react',
      'framer-motion',
    ],
  },

  server: {
    port: 5173,
    strictPort: false,
    host: true,
  },

  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },
})
