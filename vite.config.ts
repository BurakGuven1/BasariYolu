import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  envPrefix: 'VITE_',

  build: {
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
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
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Charts
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts';
            }
            // Excel/PDF export libraries (lazy loaded)
            if (id.includes('exceljs') || id.includes('jspdf')) {
              return 'export-libs';
            }
            // Animations
            if (id.includes('lottie') || id.includes('framer-motion')) {
              return 'animations';
            }
            // Maps
            if (id.includes('leaflet')) {
              return 'maps';
            }
            // UI Icons
            if (id.includes('lucide-react')) {
              return 'ui';
            }
            // Markdown/Rich text
            if (id.includes('react-markdown') || id.includes('katex') || id.includes('dompurify')) {
              return 'rich-text';
            }
            // Other vendor code
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
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