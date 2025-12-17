// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(cdktf)/)'],
  automock: false,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/cdk.out/**',
    '!**/index.ts',
    '!jest.config.ts',
    '!**/types.ts',
    '!**/.gen/**',
  ],
  coverageDirectory: './coverage/',
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'ts'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        ancestorSeparator: ' › ',
        classNameTemplate: '{classname}',
        outputDirectory: './coverage',
        titleTemplate: '{title}',
        uniqueOutputName: 'false',
        usePathForSuiteName: 'true',
      },
    ],
  ],
  setupFilesAfterEnv: ['jest-extended', '<rootDir>/setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  verbose: true,
}

export default config
