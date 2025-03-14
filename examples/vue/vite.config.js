import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: 'src/main.js'
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      }
    }
  },
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    },
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': '*'
    }
  }
})
