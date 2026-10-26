import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    outputFile: { junit: './reports/junit.xml' },
    env: { NODE_ENV: 'test' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.js'],
      exclude: ['src/server.js'],
      thresholds: { statements: 85, branches: 75, functions: 85, lines: 85 },
    },
  },
});
