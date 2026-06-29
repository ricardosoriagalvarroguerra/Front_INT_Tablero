import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El servidor de preview/dev puede asignar un puerto vía PORT; si no, 5182.
// (declare evita depender de @types/node sólo para esto.)
declare const process: { env: Record<string, string | undefined> };

const API_TARGET = process.env.VITE_API_PROXY ?? 'http://localhost:5176';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5182,
    host: true,
    // Proxy /api → backend Fastify, así el front llama rutas relativas y no
    // hardcodea el host del API. En prod se sirve detrás del mismo origen.
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
});
