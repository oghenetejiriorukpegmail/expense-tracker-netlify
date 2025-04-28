import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { getDefaultStorage } from '../../server/storage/storage-factory'

// Mock dependencies for unit tests
vi.mock('../../server/storage/storage-factory', () => ({
  getDefaultStorage: vi.fn(() => ({
    // Add mock implementations for storage methods
    getExpensesByUserId: vi.fn(),
    getExpensesByTripName: vi.fn(),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
    // Add other storage methods as needed
  }))
}))

beforeAll(() => {
  // Setup any unit test specific configuration
})

afterAll(() => {
  // Cleanup any unit test specific configuration
})

beforeEach(() => {
  // Reset all mocks before each test
  vi.resetAllMocks()
})

afterEach(() => {
  // Cleanup after each test
  vi.clearAllMocks()
})