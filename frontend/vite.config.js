import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Automatically read PORT from backend/app/.env if available
  let backendPort = env.PORT || '8000'
  const backendEnvPath = path.resolve(__dirname, '../backend/app/.env')
  if (fs.existsSync(backendEnvPath)) {
    const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf-8')
    const portMatch = backendEnvContent.match(/^PORT\s*=\s*(\d+)/m)
    if (portMatch) {
      backendPort = portMatch[1]
    }
  }

  const backendTarget = env.VITE_API_URL || env.BACKEND_URL || `http://localhost:${backendPort}`
  const devPort = parseInt(env.VITE_PORT || '5173', 10)

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
        }
      }
    },
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        }
      }
    }
  }
})