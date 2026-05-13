import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
// Hostname public qua Cloudflare Tunnel (đổi nếu bạn dùng domain khác)
const PUBLIC_TUNNEL_HOST = process.env.PUBLIC_TUNNEL_HOST || 'www.teamnghiencuu.id.vn'
// Dùng 127.0.0.1 thay vì localhost để tránh IPv6 (::1) retry trên Windows
// vì NestJS bind 0.0.0.0 (chỉ IPv4).
const BACKEND_TARGET = process.env.BACKEND_TARGET || 'http://127.0.0.1:3000'

export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  server: {
    host: true, // listen 0.0.0.0 để cloudflared truy cập được
    // Cho phép request đến từ domain qua Cloudflare Tunnel
    allowedHosts: [PUBLIC_TUNNEL_HOST, '.trycloudflare.com', '.teamnghiencuu.id.vn'],
    // HMR đi qua tunnel HTTPS -> phải dùng wss/443
    hmr: {
      host: PUBLIC_TUNNEL_HOST,
      protocol: 'wss',
      clientPort: 443,
    },
    // Vite đóng vai trò gateway: tự proxy mọi traffic từ tunnel về backend.
    proxy: {
      // REST API (strip /api để khớp route hiện tại của NestJS không có global prefix)
      '/api': {
        target: BACKEND_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Static uploads (ảnh, audio, certificates...) — không strip
      '/uploads': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
      // Legacy audio prefix
      '/audio': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
      // Socket.IO (notifications + study room presence) — cần ws
      '/socket.io': {
        target: BACKEND_TARGET,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
