import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  root: '.', // Explicitly set root to current directory
  server: { 
    port: 5173,
    proxy: { 
      '/api': 'http://localhost:8000' 
    } 
  },
  plugins: [react()]
})
