import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { loadEnv } from 'vite'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_TARGET = env.VITE_API_TARGET || 'http://localhost:3000'
  return defineConfig({
  plugins: [vue()],
  server: {
    port: 8090,
    proxy: {
      '/api/v1': {
        target: API_TARGET,
        changeOrigin: true
      },
      '/health': {
        target: API_TARGET,
        changeOrigin: true
      },
      '/healthz': {
        target: API_TARGET,
        changeOrigin: true
      }
    }
  }
  })
}
