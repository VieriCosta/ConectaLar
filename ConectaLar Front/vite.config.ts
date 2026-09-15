import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3333',
    },
    // O Fast Refresh estava deixando a aplicação vazia em atualizações parciais.
    // Com HMR desligado, o Vite faz um reload completo automático e confiável.
    hmr: false,
    watch: {
      // Em alguns ambientes Windows, os eventos de arquivo não chegam ao Vite.
      // Polling garante que o Vite detecte alterações sem precisar atualizar manualmente.
      usePolling: true,
      interval: 300,
    },
  },
});
