import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    build: {
      target: 'esnext' // Support modern JS features like await top-level
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
      // Note: VITE_ variables are automatically exposed via import.meta.env
    }
  }
})