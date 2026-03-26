import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Pedify',
        short_name: 'Pedify',
        description: 'Gestión de pedidos en tiempo real',
        theme_color: '#F59E0B',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es',
        icons: [
          { src: 'pwa-64x64.png',           sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',          sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',          sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png',sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cachear todos los assets del build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Estrategias de caché en runtime
        runtimeCaching: [
          {
            // API de pedidos — NetworkFirst para datos frescos, caché como fallback
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pedify-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }, // 1h
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Assets estáticos — StaleWhileRevalidate
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pedify-images',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 días
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/webhook': 'http://localhost:3001',
    },
  },
})
