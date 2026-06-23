import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'res',
  json: {
    stringify: false,
  },
  build: {
    outDir: '../backend/web/dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      }
    }
  },
})