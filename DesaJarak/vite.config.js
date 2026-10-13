import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // sesuaikan jika pakai react/vue

const apiProxyTarget = process.env.API_PROXY_TARGET

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    ...(apiProxyTarget && {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: apiProxyTarget.startsWith('https://'),
        },
      },
    }),
  }
})