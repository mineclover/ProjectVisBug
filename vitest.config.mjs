import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'app/dom-ref/**/*.spec.js',
      'app/edit-log/**/*.spec.js',
      'app/components/edit-log-panel/**/*.spec.js',
      'app/components/selection/**/*.spec.js',
      'app/components/vis-bug/**/*.spec.js',
      'app/features/search.spec.js',
      'app/features/**/*.wrap.spec.js',
    ],
    environment: 'jsdom',
    globals: false,
  },
})
