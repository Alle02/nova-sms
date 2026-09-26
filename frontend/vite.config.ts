import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Built output is served by FastAPI from ../static (see app.py).
export default defineConfig({
  plugins: [react()],
  base: '/static/',
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },
})
