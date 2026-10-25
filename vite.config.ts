import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sharePreview } from './scripts/share-preview';

export default defineConfig({
  plugins: [sharePreview(), react()],
  server: {
    host: true,
    allowedHosts: ['localhost', '127.0.0.1', '.trycloudflare.com'],
    // Forward SDK routes and the guest-authorized transfer preparation only.
    proxy: {
      '^/v1/database/mirrorville/subscribe(?:\\?|$)': { target: 'http://127.0.0.1:3000', ws: true, changeOrigin: true },
      '^/v1/identity/websocket-token$': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '^/v1/database/mirrorville/call/prepare_guest_transfer$': { target: 'http://127.0.0.1:3000', changeOrigin: true },
    },
  },
});
