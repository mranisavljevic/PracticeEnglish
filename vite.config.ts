/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// The catalogue can be swapped (e.g. a small fixture for e2e) via VITE_CATALOG_FILE.
const catalogFile = resolve(process.env.VITE_CATALOG_FILE ?? 'src/content/catalog.json')

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@catalog': catalogFile } },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/component/**/*.test.{ts,tsx}'],
    css: false,
  },
})
