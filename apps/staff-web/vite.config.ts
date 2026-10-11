import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Enruta cada prefijo de la API al microservicio local correspondiente (equivale al API Gateway)
const t = (port: number) => ({ target: `http://localhost:${port}`, changeOrigin: true });

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api/v1/auth': t(3001),
      '/api/v1/mesas': t(3001),
      '/api/v1/carta': t(3002),
      '/api/v1/platos': t(3002),
      '/api/v1/admin': t(3002),
      // Las fotos originales de la carta viven en la app del comensal
      '/platos': { target: 'http://localhost:5173', changeOrigin: true },
      '/api/v1/uploads': t(3002),
      '/api/v1/maridajes': t(3003),
      '/api/v1/reglas-maridaje': t(3003),
      '/api/v1/etiquetas': t(3003),
      '/api/v1/comandas': t(3004),
      '/api/v1/valoraciones': t(3004),
      '/api/v1/existencias': t(3005),
      '/api/v1/indicadores': t(3006),
      '/api/v1/auditoria': t(3006),
      '/socket.io': { ...t(3004), ws: true },
    },
  },
});
