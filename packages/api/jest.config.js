/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    // Mock graphql-request to avoid ESM issues
    '^graphql-request$': '<rootDir>/__mocks__/graphql-request.js',
    // Mock the SDK for tests
    '^@ensemble-ai/sdk$': '<rootDir>/__mocks__/@ensemble-ai/sdk.ts'
  },
  testTimeout: 15000,
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  clearMocks: true,
};

module.exports = config;