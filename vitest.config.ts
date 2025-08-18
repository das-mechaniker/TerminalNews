import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['client/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
    // Enable jsdom for client-side tests
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    setupFiles: [],
  },
});
