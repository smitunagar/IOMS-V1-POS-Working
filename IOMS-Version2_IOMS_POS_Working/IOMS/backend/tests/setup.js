// Test setup configuration
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';

// Suppress console logs during testing unless explicitly testing them
if (process.env.JEST_VERBOSE !== 'true') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}

// Global test timeout
jest.setTimeout(10000);
