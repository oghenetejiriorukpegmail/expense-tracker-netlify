import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Test environment configuration
export const testConfig = {
  // API endpoints
  api: {
    baseUrl: process.env.VITE_API_URL || 'http://localhost:3000',
    endpoints: {
      auth: '/api/auth',
      expenses: '/api/expenses',
      trips: '/api/trips',
      mileage: '/api/mileage',
      analytics: '/api/analytics',
      profile: '/api/profile',
      settings: '/api/settings',
    },
  },

  // Authentication
  auth: {
    domain: process.env.VITE_AUTH_DOMAIN || 'test.auth0.com',
    clientId: process.env.VITE_AUTH_CLIENT_ID || 'test-client-id',
    testUser: {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword',
    },
  },

  // File paths
  paths: {
    testData: resolve(__dirname, './test-data'),
    fixtures: resolve(__dirname, './fixtures'),
    uploads: resolve(__dirname, './uploads'),
    downloads: resolve(__dirname, './downloads'),
  },

  // Test timeouts
  timeouts: {
    defaultTest: 10000,
    networkRequest: 5000,
    animation: 1000,
    render: 1000,
  },

  // Database configuration for tests
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgres://test:test@localhost:5432/test_db',
    schema: 'test_schema',
    cleanupAfterEach: true,
  },

  // Storage configuration for tests
  storage: {
    bucket: 'test-bucket',
    region: 'us-east-1',
    endpoint: process.env.TEST_STORAGE_ENDPOINT || 'http://localhost:9000',
  },

  // Test data configuration
  testData: {
    // Sample sizes for different test scenarios
    sampleSizes: {
      small: 10,
      medium: 50,
      large: 100,
      stress: 1000,
    },

    // Date ranges for testing
    dateRanges: {
      past: {
        start: '2024-01-01',
        end: '2024-12-31',
      },
      current: {
        start: '2025-01-01',
        end: '2025-12-31',
      },
      future: {
        start: '2026-01-01',
        end: '2026-12-31',
      },
    },

    // Test file configurations
    files: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      dimensions: {
        max: { width: 2000, height: 2000 },
        min: { width: 100, height: 100 },
      },
    },
  },

  // Feature flags for tests
  featureFlags: {
    enableMocking: true,
    useTestDatabase: true,
    cleanupAfterTests: true,
    recordNetworkRequests: true,
    recordConsoleOutput: true,
    takeScreenshotsOnFailure: true,
  },

  // Test reporting configuration
  reporting: {
    screenshots: {
      enabled: true,
      directory: resolve(__dirname, './screenshots'),
      takeOnFailure: true,
    },
    video: {
      enabled: false,
      directory: resolve(__dirname, './videos'),
      recordOnFailure: true,
    },
    console: {
      captureOutput: true,
      filterWarnings: true,
    },
    coverage: {
      enabled: true,
      directory: resolve(__dirname, '../coverage'),
      threshold: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },

  // Browser configuration for E2E tests
  browser: {
    defaultViewport: {
      width: 1280,
      height: 720,
    },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    headless: true,
  },

  // Mock service worker configuration
  msw: {
    enabled: true,
    quiet: true,
    onUnhandledRequest: 'warn',
  },
}

export default testConfig