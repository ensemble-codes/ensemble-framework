import { jest } from '@jest/globals';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Set test environment
process.env.NODE_ENV = 'test';

// Mock external dependencies that might not be available in test environment
jest.mock('keytar', () => ({
  getPassword: jest.fn(),
  setPassword: jest.fn(),
  deletePassword: jest.fn(),
}));

jest.mock('update-notifier', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    notify: jest.fn(),
  })),
}));

// Global test timeout
jest.setTimeout(30000);