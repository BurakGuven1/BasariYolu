import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Environment variables prefix
  envPrefix: 'VITE_',
  
  build: {
    // Source maps for debugging
    sourcemap: true,
    
    // Rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['lucide-react']
        }
      }
    },
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  
  // Optimize deps
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-is',
      'prop-types',
      'recharts',
      '@supabase/supabase-js'
    ]
  },
  
  // Server config for development
  server: {
    port: 5173,
    strictPort: false,
    host: true
  },
  
  // Preview config
  preview: {
    port: 4173,
    strictPort: false,
    host: true
  }
})