import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static frontend application calling Google Gemini API directly from the browser
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
