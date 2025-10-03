import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), livestoreDevtoolsPlugin({ 
    schemaPath: './src/livestore/schema.ts',
    mode: { _tag: 'web' }
  })],
  server: {
    port: 60000,
  },
  optimizeDeps: {
    exclude: ['@livestore/wa-sqlite'],
  },
  worker: {
    format: 'es',
  },
})
