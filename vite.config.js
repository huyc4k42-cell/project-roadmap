import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app.html'),
        landing: resolve(__dirname, 'index.html'),
      }
    }
  },
  server: {
    port: 3333,
    open: '/app.html'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
