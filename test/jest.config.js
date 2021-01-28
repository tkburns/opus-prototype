const path = require('path');

module.exports = {
  verbose: true,
  rootDir: '../',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: [
    '**/*.spec.[jt]s?(x)',
  ],
  transform: {
    '\\.ts$': 'ts-jest',
    '\\.js$': ['babel-jest', { configFile: path.resolve(__dirname, 'babel.config.js') }]
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^&/(.*)$': '<rootDir>/src/$1',
    '^&test/(.*)$': '<rootDir>/test/$1'
  },
  setupFilesAfterEnv: [
    'jest-extended'
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  coverageReporters: [
    'text',
    'html'
  ],
  coverageDirectory: './reports/coverage',
  collectCoverageFrom: ['./src/**/*.{ts,js}', '!**/@types/**']
};
