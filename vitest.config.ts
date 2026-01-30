import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/?(*.)+(spec|test).[t]s?(x)'],
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
      },
      exclude: [
        '**/*.d.ts',
        '**/*.js',
        '**/*.mjs',
        '**/cdk.out/**',
        '**/index.ts',
        'vitest.config.ts',
        '**/types.ts',
        '**/.gen/**',
        '**/theme/**',
        '**/test/tools/**',
        'coverage/**',
        'dist/**',
        'node_modules/**',
      ],
    },
  },
})
