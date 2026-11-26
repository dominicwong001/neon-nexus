import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: true,
    port: 8000,
    strictPort: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
    port: 8000,
    strictPort: true,
  },
})
