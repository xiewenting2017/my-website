import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.{test,spec}.{js,jsx}'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // 用 IPv4 直连，避免 localhost 解析到 ::1 导致代理 ECONNREFUSED
        changeOrigin: true,
        ws: false, // 关闭 WebSocket
        timeout: 30000, // 增加超时时间
        proxyTimeout: 30000,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const ct = proxyRes.headers['content-type'] || ''
            // 针对 SSE 流式输出做特殊处理
            if (ct.includes('text/event-stream')) {
              proxyRes.headers['cache-control'] = 'no-cache, no-transform'
              proxyRes.headers['connection'] = 'keep-alive'
              proxyRes.headers['x-accel-buffering'] = 'no'
            }
          })
        },
      },
    },
  },
})