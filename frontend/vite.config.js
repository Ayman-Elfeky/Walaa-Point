import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 7000,
    allowedHosts: ['app7000.maayn.me'] // 👈 Add your custom hostname here
  }
})
