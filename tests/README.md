# Expense Tracker Test Suite

This directory contains the comprehensive test suite for the Expense Tracker application, including unit tests, integration tests, and end-to-end tests.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests using Playwright
│   ├── auth.e2e.ts        # Authentication flow tests
│   ├── expense.e2e.ts     # Expense management tests
│   ├── trip.e2e.ts        # Trip management tests
│   ├── analytics.e2e.ts   # Analytics feature tests
│   ├── mileage.e2e.ts     # Mileage log tests
│   ├── settings.e2e.ts    # Settings and profile tests
│   └── setup.ts           # E2E test setup and utilities
├── unit/                   # Unit tests using Vitest
│   └── stores/            # Store tests
│       ├── settings.test.ts
│       ├── sidebar.test.ts
│       └── modal.test.ts
├── setup.ts               # Global test setup
├── test-utils.ts          # Shared test utilities
├── test.config.ts         # Test configuration
└── README.md             # This file
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up test environment variables:
```bash
# Create .env.test file
cp .env.example .env.test
# Edit .env.test with your test configuration
```

3. Set up test database:
```bash
npm run db:migrate
```

## Running Tests

### Using the Test Runner Script

The `run-tests.ps1` PowerShell script provides a convenient way to run tests:

```powershell
# Run all tests
.\run-tests.ps1

# Run specific test types
.\run-tests.ps1 -TestType unit
.\run-tests.ps1 -TestType e2e
.\run-tests.ps1 -TestType coverage

# Run in watch mode
.\run-tests.ps1 -Watch

# Open test UI
.\run-tests.ps1 -UI

# Update snapshots
.\run-tests.ps1 -UpdateSnapshots

# Run with verbose output
.\run-tests.ps1 -Verbose
```

### Using NPM Scripts

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Open test UI
npm run test:ui
```

## Test Configuration

The test suite configuration is managed in `test.config.ts`. Key configurations include:

- API endpoints
- Authentication settings
- File paths
- Test timeouts
- Database configuration
- Storage settings
- Test data configurations
- Feature flags
- Reporting settings
- Browser configurations

## Writing Tests

### Unit Tests

Unit tests use Vitest and should follow these conventions:

```typescript
import { describe, it, expect } from 'vitest'

describe('Component/Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

### E2E Tests

E2E tests use Playwright and should follow these conventions:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Flow', () => {
  test('should complete a specific user journey', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  })
})
```

## Test Utilities

The `test-utils.ts` file provides common utilities:

- Mock data generators
- Date utilities
- Number formatting
- Event simulators
- Cleanup utilities
- Assertion helpers

## Mocking

### API Mocks

```typescript
import { createMockFetch } from '../test-utils'

const mockFetch = createMockFetch({
  data: { /* mock data */ },
  status: 200
})
```

### File Mocks

```typescript
import { mockFileGenerators } from '../test-utils'

const mockFile = mockFileGenerators.createImageFile('receipt.jpg')
```

## Test Coverage

Coverage reports are generated in the `coverage` directory. Minimum coverage thresholds:

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests.

2. **Naming**: Use clear, descriptive test names that explain the expected behavior.

3. **Arrange-Act-Assert**: Structure tests using the AAA pattern.

4. **Cleanup**: Clean up any test data or state after each test.

5. **Mocking**: Use mocks judiciously and only mock what's necessary.

6. **Assertions**: Make specific assertions rather than general ones.

7. **Documentation**: Add comments for complex test scenarios.

## Debugging Tests

1. Use the `--debug` flag for detailed output:
```bash
npm run test:unit -- --debug
```

2. Use the UI mode for interactive debugging:
```bash
npm run test:ui
```

3. Use browser developer tools in E2E tests:
```bash
npm run test:e2e -- --debug
```

## Contributing

1. Follow the existing test structure and naming conventions
2. Update test documentation when adding new test utilities or patterns
3. Ensure all tests pass before submitting changes
4. Update test configuration if adding new features
5. Add appropriate test coverage for new features

## Troubleshooting

Common issues and solutions:

1. **Tests timing out**: Adjust timeouts in test.config.ts
2. **Database connection issues**: Check test database configuration
3. **Authentication failures**: Verify test credentials
4. **Flaky tests**: Use retry mechanisms and proper wait conditions
5. **Missing dependencies**: Run npm install with --legacy-peer-deps