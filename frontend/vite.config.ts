import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Asegura que la aplicación sea accesible desde la red local para pruebas
    host: '0.0.0.0',
  },
  // Agrega metadatos para pruebas de accesibilidad en desarrollo
  define: {
    __A11Y_TESTING__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  build: {
    // Genera sourcemaps para facilitar depuración
    sourcemap: true,
  },
})