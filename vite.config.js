import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Production System',
        short_name: 'Production',
        description: 'Factory Production Management System',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],

  server: {
    host: true,

    watch: {
      usePolling: true,
    },
  },

  // اجبار Vite به پیش‌باندل کردن این پکیج‌های CJS به‌صورت درست
  // برای رفع باگ interop که باعث ارور "Element type is invalid" میشه
  optimizeDeps: {
    include: ['react-multi-date-picker', 'react-date-object'],
    force: true,
  },
})