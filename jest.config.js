module.exports = {
  browser: true,
  verbose: true,
  rootDir: __dirname,
  setupTestFrameworkScriptFile: '<rootDir>/tools/test-setup.js',
  moduleDirectories: ['<rootDir>/node_modules', '<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '/__test__/.*\\.spec\\.tsx?$',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__test__/**'],
  coverageReporters: ['lcov', 'html']
}
