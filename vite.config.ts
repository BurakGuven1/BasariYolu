import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  envPrefix: 'VITE_',

  build: {
    // Disable sourcemap in production to speed up builds
    sourcemap: false,

    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      }
    },

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
      'react-leaflet'
    ]
  },

  server: {
    port: 5173,
    strictPort: false,
    host: true
  },

  preview: {
    port: 4173,
    strictPort: false,
    host: true
  }
})