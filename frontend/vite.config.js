// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')

  const isProd = mode === 'production'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      }
    },
    define: {
      // small convenience constant (optional)
      __DISABLE_API_LOGS__: JSON.stringify(!!env.VITE_DISABLE_API_LOGS)
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          // remove console.* only in production builds (stronger safety)
          drop_console: isProd,
          // also drop debugger
          drop_debugger: isProd
        }
      },
      // enable sourcemaps in dev for debugging, disable in production
      sourcemap: !isProd,
    },
    optimizeDeps: {
      exclude: ['@undecaf/barcode-detector-polyfill']
    }
  }
})
