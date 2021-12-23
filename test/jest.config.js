const path = require('path');

module.exports = {
  verbose: true,
  rootDir: path.resolve(__dirname, '../'),
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
  collectCoverageFrom: [
    './src/utils/**/*.{ts,js}',
    '!./src/utils/setup-aliases.ts',
    '!**/@types/**',
    '!**/__tests__/**'
  ]
};
