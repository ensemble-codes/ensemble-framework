module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    // Mock graphql-request to avoid ESM issues
    'graphql-request': '<rootDir>/__mocks__/graphql-request.js'
  },
  testTimeout: 15000
};