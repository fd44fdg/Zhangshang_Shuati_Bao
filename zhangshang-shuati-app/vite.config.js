import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  publicDir: 'public',
  plugins: [uni()],
  build: {
    rollupOptions: {
      input: 'src/main.js'
    }
  },
  server: {
    port: 8083,
    host: '0.0.0.0',
    open: true
  },
  define: {
    'process.env.UNI_PLATFORM': JSON.stringify('h5')
  }
})
