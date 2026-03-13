import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // VITE_BASE is injected by the GitHub Actions workflow as /repo-name/
  // Locally it falls back to '/' so dev server works normally
  base: process.env.VITE_BASE || '/',
})
