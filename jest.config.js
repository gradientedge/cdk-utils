// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  transform: {
    '^.+\\.(ts)$': 'ts-jest'
  },
  coverageDirectory: '<rootDir>/coverage/',
  collectCoverageFrom: [
    'src/**/*.ts'
  ],
  reporters: ['default', 'jest-junit'],
  moduleFileExtensions: ["js"],
}
