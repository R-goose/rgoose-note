import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:18080',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      external: [/\/test\//],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('katex')) return 'vendor-katex'
            if (id.includes('jspdf')) return 'vendor-pdf'
            if (id.includes('html2canvas')) return 'vendor-pdf'
            if (id.includes('interactjs')) return 'vendor-interact'
          }
        }
      }
    }
  },
  publicDir: 'public'
})
