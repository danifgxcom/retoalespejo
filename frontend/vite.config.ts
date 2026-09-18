import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { GAME_NAME, GAME_TAGLINE } from './src/branding'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'branding',
      transformIndexHtml: (html) => html
        .replaceAll('%GAME_NAME%', GAME_NAME)
        .replaceAll('%GAME_TAGLINE%', GAME_TAGLINE),
    },
  ],
  resolve: {
    // Vite consume el TypeScript compartido; el backend usa su salida CommonJS.
    alias: {
      '@reto/geometry': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    // Asegura que la aplicación sea accesible desde la red local para pruebas
    host: '0.0.0.0',
  },
  // Agrega metadatos para pruebas de accesibilidad en desarrollo
  define: {
    __A11Y_TESTING__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  build: {
    sourcemap: false,
  },
})
