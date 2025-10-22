import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  envPrefix: 'VITE_',
  
  build: {

    sourcemap: true,

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['lucide-react'],
          'maps': ['leaflet', 'react-leaflet']
        }
      }
    },
    
    chunkSizeWarningLimit: 1000
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