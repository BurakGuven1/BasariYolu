import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  envPrefix: 'VITE_',

  build: {
    // Disable sourcemap in production to speed up builds
    sourcemap: false,

    // Use esbuild for faster builds (default, no extra dependency needed)
    minify: 'esbuild',

    // Let Vite handle chunk splitting to avoid loader order issues
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],

          // UI libraries
          'ui-icons': ['lucide-react'],
          'ui-charts': ['recharts'],
          'ui-markdown': ['react-markdown', '@uiw/react-md-editor'],

          // Maps (only if used)
          'maps': ['leaflet', 'react-leaflet'],

          // Heavy libraries
          'pdf': ['jspdf', 'html2canvas'],
          'math': ['react-katex']
        }
      }
    },

    chunkSizeWarningLimit: 1000,

    // Optimize build performance
    target: 'es2015',
    cssCodeSplit: true
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
