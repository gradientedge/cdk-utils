// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  automock: false,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts', '!**/cdk.out/**', '!**/index.ts', '!jest.config.ts', '!**/types.ts'],
  coverageDirectory: './coverage/',
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'ts'],
  preset: 'ts-jest',
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
  setupFilesAfterEnv: ['jest-extended'],
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  verbose: true,
}
