import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Integration suites share one emulator and each clears Firestore before
    // its tests, so files must not run concurrently.
    fileParallelism: false,
    // Integration tests connect to a dedicated emulator started by
    // `npm run test:integration`; unit tests need no emulator.
  },
})
