import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      tailwindcss(),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    server: {
      port: Number(env.VITE_PORT) || 5174,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8083',
          changeOrigin: true,
        },
      },
    },
  }
})
