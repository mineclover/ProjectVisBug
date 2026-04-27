import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'app/edit-log/**/*.spec.js',
      'app/components/edit-log-panel/**/*.spec.js',
    ],
    environment: 'jsdom',
    globals: false,
  },
})
