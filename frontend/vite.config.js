// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Permite importar con @ en lugar de rutas relativas
      // Ej: import useAuth from '@/composables/useAuth.js'
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
