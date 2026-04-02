import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/?(*.)+(spec|test).[t]s?(x)'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov', 'clover'],
      reportOnFailure: true,
      thresholds: {
        global: {
          branches: 70,
          functions: 90,
          lines: 90,
          statements: 80,
        },
        perFile: true,
        lines: 80,
        statements: 80,
      },
      exclude: [
        '**/*.d.ts',
        '**/*.js',
        '**/*.mjs',
        '**/index.ts',
        'vitest.config.ts',
        '**/types.ts',
        'coverage/**',
        'dist/**',
        'node_modules/**',
        'test/**',
      ],
    },
  },
})
