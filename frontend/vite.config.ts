import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { yamlPlugin } from './src/plugins/yamlPlugin'

const variablesPath = path.resolve(__dirname, 'src/styles/variables.scss').replace(/\\/g, '/')

export default defineConfig({
  plugins: [react(), yamlPlugin()],
  cacheDir: path.resolve(__dirname, '.vite'),
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "${variablesPath}" as *;\n`,
      },
    },
  },
})
