import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 代理：把 /api 开头的请求转发到后端 8081，解决跨域
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      // 图片目录也代理到后端，娃娃图片才能正常显示
      '/uploads': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
})
