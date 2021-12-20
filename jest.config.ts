// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  automock: false,
  clearMocks: true,
  coverageDirectory: './coverage/',
  coverageProvider: 'v8',
  collectCoverage: true,
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts', '!**/cdk.out/**', '!**/index.ts', '!jest.config.ts', '!**/types.ts'],
  moduleFileExtensions: ['js', 'ts'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        uniqueOutputName: 'false',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: 'true',
      },
    ],
  ],
  preset: 'ts-jest',
  setupFilesAfterEnv: ['jest-extended'],
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[t]s?(x)'],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  verbose: true,
}
