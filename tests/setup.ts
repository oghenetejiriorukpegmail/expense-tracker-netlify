import { expect, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { vi } from 'vitest'

// Extend vitest's expect with testing-library matchers
expect.extend(matchers)

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  
  constructor(private callback: IntersectionObserverCallback) {}
  
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver
})

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: class MockChart {
    constructor() {}
    destroy = vi.fn()
    update = vi.fn()
  },
  registerables: [],
}))

// Common test data
export const testData = {
  user: {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    authUserId: 'auth0|123',
  },
  trip: {
    id: 1,
    name: 'Test Trip',
    startDate: '2025-04-28',
    endDate: '2025-04-30',
    budget: 1000,
    location: 'Test Location',
    userId: 1,
  },
  expense: {
    id: 1,
    type: 'Food',
    date: '2025-04-28',
    vendor: 'Test Vendor',
    location: 'Test Location',
    cost: 50.00,
    tripName: 'Test Trip',
    userId: 1,
  },
  mileageLog: {
    id: 1,
    userId: 1,
    tripId: 1,
    date: '2025-04-28',
    startOdometer: 1000,
    endOdometer: 1100,
    totalMiles: 100,
    purpose: 'Test Purpose',
  },
}

// Mock API responses
export const mockApiResponses = {
  login: {
    success: {
      token: 'mock-token',
      user: testData.user,
    },
    error: {
      message: 'Invalid credentials',
    },
  },
  expenses: {
    list: [testData.expense],
    create: testData.expense,
    update: { ...testData.expense, cost: 75.00 },
    delete: { success: true },
  },
  trips: {
    list: [testData.trip],
    create: testData.trip,
    update: { ...testData.trip, budget: 1500 },
    delete: { success: true },
  },
}

// Mock file data
export const mockFiles = {
  receipt: new File(['mock-receipt'], 'receipt.jpg', { type: 'image/jpeg' }),
  odometerImage: new File(['mock-odometer'], 'odometer.jpg', { type: 'image/jpeg' }),
  expenseReport: new File(['mock-report'], 'report.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
}

// Setup before all tests
beforeAll(() => {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })

  // Mock console.error to fail tests on React errors
  const originalError = console.error
  console.error = (...args: any[]) => {
    originalError(...args)
    throw new Error(args[0])
  }

  // Set test environment variables
  process.env.VITE_API_URL = 'http://localhost:3000'
  process.env.VITE_AUTH_DOMAIN = 'test.auth0.com'
  process.env.VITE_AUTH_CLIENT_ID = 'test-client-id'
})

// Cleanup after each test
afterEach(() => {
  // Cleanup any mounted React components
  cleanup()
  
  // Clear all mocks
  vi.clearAllMocks()
  
  // Clear localStorage
  localStorageMock.clear()
})

// Helper functions
export const mockFetch = (response: any) => {
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
      blob: () => Promise.resolve(new Blob()),
    })
  )
}

export const mockFileUpload = (file: File) => {
  return {
    target: {
      files: [file],
    },
  }
}

export const waitForLoadingToComplete = async () => {
  // Wait for any loading states to resolve
  await new Promise(resolve => setTimeout(resolve, 0))
}

export const simulateNetworkError = () => {
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.reject(new Error('Network error'))
  )
}

export const simulateApiError = (status: number, message: string) => {
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ message }),
    })
  )
}