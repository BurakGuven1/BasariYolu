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
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split vendor libraries into separate chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-is') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            // Router
            if (id.includes('react-router')) {
              return 'react-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Charts (heavy - lazy loaded)
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts';
            }
            // Excel/PDF export libraries (very heavy - lazy loaded)
            if (id.includes('exceljs') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'export-libs';
            }
            // Animations - Keep with vendor to ensure React is loaded first
            // FIX: animations chunk was loading before react-vendor causing createContext error
            if (id.includes('lottie') || id.includes('framer-motion')) {
              return 'vendor';
            }
            // Maps (heavy - lazy loaded)
            if (id.includes('leaflet')) {
              return 'maps';
            }
            // Markdown/Rich text (heavy - lazy loaded)
            if (id.includes('react-markdown') || id.includes('katex') || id.includes('dompurify') || id.includes('@uiw/react-md-editor')) {
              return 'rich-text';
            }
            // PDF.js (very heavy - lazy loaded)
            if (id.includes('pdfjs')) {
              return 'pdf-libs';
            }
            // Other vendor code
            return 'vendor';
          }
        },
        // Better file naming for caching
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