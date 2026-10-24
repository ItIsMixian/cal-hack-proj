import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['localhost', '127.0.0.1', '.trycloudflare.com'],
    // The share URL forwards only SDK connection/auth routes, not database admin APIs.
    proxy: {
      '^/v1/database/mirrorville/subscribe(?:\\?|$)': { target: 'http://127.0.0.1:3000', ws: true, changeOrigin: true },
      '^/v1/identity/websocket-token$': { target: 'http://127.0.0.1:3000', changeOrigin: true },
    },
  },
});
