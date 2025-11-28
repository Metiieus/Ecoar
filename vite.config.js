import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  // 🔧 Variáveis de ambiente (para rodar build sem erro)
  define: {
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:5175'
    ),
  },

  // 🧩 Plugins
  plugins: [
    react(), 
    tailwindcss(),
    // 🔧 CORREÇÃO: Copiar arquivos WASM do sql.js para a raiz do dist
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/sql.js/dist/sql-wasm.wasm',
          dest: ''
        }
      ]
    })
  ],

  // 📦 Caminho correto para o GitHub Pages
  // ⚠️ TEM que ser exatamente o nome do repositório:
  // https://metiieus.github.io/Ecoar/
  base: process.env.NODE_ENV === 'production' ? '/Ecoar/' : '/',

  // 🧭 Alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 🌐 Dev server
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

  // ⚙️ Build
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  // 🔧 CORREÇÃO: Otimizações para WASM - excluir sql.js do pre-bundling
  optimizeDeps: {
    exclude: ['sql.js']
  }
})
