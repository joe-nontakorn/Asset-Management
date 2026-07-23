import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/line-api': {
          target: env.LINE_API_BASE || 'http://localhost:3002',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/line-api/, '/api'),
        },
      },
    },
  }
})
