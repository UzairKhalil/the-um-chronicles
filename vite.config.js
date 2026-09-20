import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps the build working at a GitHub project-page URL
// (https://user.github.io/repo/) without hardcoding the repo name.
// This only holds while the app has no path-based router — the second
// page is reached with a hash (#history), never a path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
