/**
 * Jest setup file
 *
 * This file runs before each test suite and sets up the testing environment.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want to silence console logs during tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Cleanup after all tests
afterAll(() => {
  // Close any open connections, cleanup resources, etc.
});
