# Testing Documentation

This document describes the testing strategy and practices for the POS Dashboard.

## Table of Contents

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Utilities](#test-utilities)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)

## Overview

The testing strategy follows a three-tier approach:

- **Unit Tests**: Test individual functions and modules in isolation
- **Integration Tests**: Test API endpoints and database interactions
- **End-to-End Tests**: Test complete user workflows (using Playwright)

### Test Coverage Goals

- **Overall Coverage**: 80%+
- **Critical Paths**: 90%+
- **Utilities**: 100%

## Test Types

### Unit Tests

Unit tests focus on testing individual functions, utilities, and services in isolation.

**Location**: `src/__tests__/unit/`

**What to test**:
- Utility functions (locks, auth helpers, etc.)
- Service layer business logic
- Data transformations
- Validation logic

**Example**:
```typescript
// src/__tests__/unit/utils/locks.test.ts
import { acquireLock, releaseLock } from '@utils/locks';

describe('Lock utilities', () => {
  it('should acquire and release locks', () => {
    const lockId = 'test-lock';
    expect(acquireLock(lockId)).toBe(true);
    expect(acquireLock(lockId)).toBe(false); // Should fail on second attempt
    releaseLock(lockId);
    expect(acquireLock(lockId)).toBe(true); // Should succeed after release
  });
});
```

### Integration Tests

Integration tests verify that different parts of the application work together correctly, particularly API endpoints and database operations.

**Location**: `src/__tests__/integration/`

**What to test**:
- API request/response flows
- Database CRUD operations
- Authentication/authorization
- Error handling
- Webhook processing

**Example**:
```typescript
// src/__tests__/integration/employees.test.ts
import request from 'supertest';
import { app } from '@/app';
import { mockEmployee, cleanupTestData } from '@/__tests__/helpers';

describe('Employee API', () => {
  afterEach(async () => {
    await cleanupTestData(['employees']);
  });

  it('GET /api/employees should return employee list', async () => {
    const response = await request(app).get('/api/employees');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /api/employee should create new employee', async () => {
    const employee = mockEmployee();
    const response = await request(app)
      .post('/api/employee')
      .send(employee);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });
});
```

### End-to-End Tests

E2E tests use Playwright to test complete user workflows through the browser.

**Location**: `tests/` (Playwright tests)

**What to test**:
- User registration and login flows
- Order creation and fulfillment
- POS transactions
- Kitchen display system
- Multi-step workflows

**Commands**:
```bash
yarn test:e2e              # Run all E2E tests
yarn test:e2e:ui           # Run with Playwright UI
yarn test:e2e:headed       # Run with visible browser
```

## Running Tests

### Quick Start

```bash
# Run all Jest tests
yarn test

# Run only unit tests
yarn test:unit

# Run only integration tests
yarn test:integration

# Run tests in watch mode (for development)
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

### Running Specific Tests

```bash
# Run a specific test file
yarn test src/__tests__/unit/utils/locks.test.ts

# Run tests matching a pattern
yarn test --testNamePattern="should acquire lock"

# Run tests for a specific module
yarn test locks
```

### Test Environment Setup

Before running integration tests, ensure you have:

1. **Test Database**: A separate PostgreSQL database for testing
   ```bash
   createdb pos_test
   ```

2. **Environment Variables**: Set `TEST_DATABASE_URL` in your `.env` file
   ```
   TEST_DATABASE_URL=postgresql://user:password@localhost:5432/pos_test
   ```

3. **Database Schema**: Run migrations on the test database
   ```bash
   # Apply schema to test database
   psql pos_test < schema.sql
   ```

## Writing Tests

### Test Structure

Follow the AAA pattern (Arrange, Act, Assert):

```typescript
describe('Feature/Module', () => {
  // Setup before tests
  beforeAll(async () => {
    // One-time setup
  });

  beforeEach(async () => {
    // Setup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  afterAll(async () => {
    // One-time cleanup
  });

  it('should do something specific', async () => {
    // Arrange - Set up test data and conditions
    const testData = mockEmployee();

    // Act - Execute the code being tested
    const result = await createEmployee(testData);

    // Assert - Verify the results
    expect(result).toBeDefined();
    expect(result.id).toBeTruthy();
  });
});
```

### Naming Conventions

- **Test files**: `*.test.ts` or `*.test.tsx`
- **Describe blocks**: Use descriptive names (e.g., "Employee Service", "GET /api/employees")
- **Test cases**: Start with "should" (e.g., "should create employee", "should return 404 for invalid ID")

### Using Test Utilities

The project provides several test utilities to make testing easier:

#### Mock Data Generators

```typescript
import { mockEmployee, mockOrder, mockMany } from '@/__tests__/helpers';

// Generate a single mock employee
const employee = mockEmployee();

// Generate with custom values
const customEmployee = mockEmployee({ role: 'manager' });

// Generate multiple instances
const employees = mockMany(mockEmployee, 5);
```

#### Database Helpers

```typescript
import {
  getTestPool,
  cleanupTestData,
  seedTestData
} from '@/__tests__/helpers';

// Clean up test data after tests
afterEach(async () => {
  await cleanupTestData(['employees', 'orders']);
});

// Seed test data before tests
beforeEach(async () => {
  const employees = mockMany(mockEmployee, 3);
  await seedTestData('employees', employees);
});
```

#### API Testing Helpers

```typescript
import { createTestRequest, expectResponse } from '@/__tests__/helpers';

const api = createTestRequest(app);

it('should return 200', async () => {
  const response = await api.get('/api/employees');
  expectResponse.success(response);
});

it('should return 400 for invalid data', async () => {
  const response = await api.post('/api/employee', { invalid: 'data' });
  expectResponse.badRequest(response);
});
```

## Best Practices

### Do's

✅ **Write tests before refactoring** - This ensures you don't break existing functionality
✅ **Test edge cases** - Include tests for error conditions, empty inputs, etc.
✅ **Use descriptive test names** - Make it clear what's being tested
✅ **Keep tests isolated** - Each test should be independent
✅ **Clean up after tests** - Always clean up test data and close connections
✅ **Mock external services** - Mock Stripe, Shopify, Google Drive in unit tests
✅ **Use test helpers** - Leverage the provided utilities for consistency

### Don'ts

❌ **Don't test implementation details** - Test behavior, not internals
❌ **Don't make tests dependent on each other** - Each test should run independently
❌ **Don't use production database** - Always use a separate test database
❌ **Don't skip cleanup** - Always clean up test data and resources
❌ **Don't test third-party libraries** - Focus on your own code
❌ **Don't duplicate test logic** - Use helpers and utilities

### Testing Async Code

Always use async/await for asynchronous tests:

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Mocking External Services

Use Jest mocks for external services:

```typescript
// Mock Stripe
jest.mock('stripe', () => ({
  Stripe: jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
    },
  })),
}));

// Mock Shopify
jest.mock('@shopify/shopify-api', () => ({
  shopifyApi: jest.fn(),
}));
```

### Database Testing

For database tests:

1. Use transactions for isolation when possible
2. Clean up data after each test
3. Use a separate test database
4. Seed minimal required data

```typescript
describe('Database operations', () => {
  let client: PoolClient;

  beforeEach(async () => {
    const pool = getTestPool();
    client = await pool.connect();
    await client.query('BEGIN');
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    client.release();
  });

  it('should insert employee', async () => {
    // Test within transaction
  });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18.16.1'

      - name: Install dependencies
        run: yarn install

      - name: Run unit tests
        run: yarn test:unit

      - name: Run integration tests
        run: yarn test:integration
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Troubleshooting

### Common Issues

**Problem**: Tests timeout
**Solution**: Increase timeout in jest.config.js or use `jest.setTimeout()`

**Problem**: Database connection errors
**Solution**: Ensure TEST_DATABASE_URL is set and database is running

**Problem**: Tests pass locally but fail in CI
**Solution**: Check for environment-specific issues, hardcoded paths, or race conditions

**Problem**: Flaky tests
**Solution**: Ensure tests are isolated, avoid timing dependencies, clean up properly

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure tests pass locally
3. Maintain or improve code coverage
4. Update this documentation if needed
5. Add examples for complex test scenarios

---

**Last Updated**: 2025-10-08
**Maintained By**: Development Team
