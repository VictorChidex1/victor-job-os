import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Integration tests connect to a dedicated emulator started by
    // `npm run test:integration`; unit tests need no emulator.
  },
})
