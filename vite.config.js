import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // 🔧 Define variáveis de ambiente (usadas no build)
  define: {
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:5175'
    ),
  },

  // 🧩 Plugins do projeto
  plugins: [react(), tailwindcss()],

  // 📦 Caminho base para deploy no GitHub Pages
  base: '/Ecoar/',

  // 🧭 Alias para imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 🌐 Configuração do servidor de desenvolvimento local
  server: {
    allowedHosts: ['*'],
    proxy: {
      '/api': {
        target: 'https://tb8calt97j.execute-api.sa-east-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/dev'),
      },
    },
  },

  // ⚙️ Build otimizado para produção
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
