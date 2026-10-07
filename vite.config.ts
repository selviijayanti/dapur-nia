import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@firebase/auth': path.resolve(import.meta.dirname, './node_modules/@firebase/auth/dist/esm2017/index.js'),
    },
  },
})
