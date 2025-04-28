import { vi } from 'vitest'
import type { Mock } from 'vitest'
import testConfig from './test.config'

// Type definitions
export interface MockResponse<T = any> {
  ok: boolean
  status: number
  json: () => Promise<T>
  blob: () => Promise<Blob>
}

export interface MockFetchOptions {
  status?: number
  ok?: boolean
  headers?: Record<string, string>
  delay?: number
}

// Mock API response generator
export const createMockResponse = <T>(data: T, options: MockFetchOptions = {}): MockResponse<T> => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  json: () => Promise.resolve(data),
  blob: () => Promise.resolve(new Blob()),
})

// Mock fetch implementation
export const createMockFetch = (response: any, options: MockFetchOptions = {}) => {
  return vi.fn().mockImplementation(() => 
    new Promise((resolve) => {
      if (options.delay) {
        setTimeout(() => resolve(createMockResponse(response, options)), options.delay)
      } else {
        resolve(createMockResponse(response, options))
      }
    })
  )
}

// Date utilities
export const dateUtils = {
  toISODate: (date: Date): string => date.toISOString().split('T')[0],
  
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  },
  
  formatDate: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US').format(date)
  },
  
  getDateRange: (start: Date, end: Date): Date[] => {
    const dates: Date[] = []
    let current = new Date(start)
    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }
}

// Number utilities
export const numberUtils = {
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  },
  
  roundToDecimal: (num: number, decimals: number = 2): number => {
    return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals)
  },
  
  generateRandomNumber: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}

// Mock data generators
export const mockDataGenerators = {
  expense: (overrides = {}) => ({
    id: Math.random().toString(36).substr(2, 9),
    type: 'Food',
    date: dateUtils.toISODate(new Date()),
    vendor: 'Test Vendor',
    location: 'Test Location',
    cost: 50.00,
    comments: 'Test expense',
    tripName: 'Test Trip',
    ...overrides
  }),

  trip: (overrides = {}) => ({
    id: Math.random().toString(36).substr(2, 9),
    name: 'Test Trip',
    description: 'Test description',
    startDate: dateUtils.toISODate(new Date()),
    endDate: dateUtils.toISODate(dateUtils.addDays(new Date(), 7)),
    budget: 1000,
    location: 'Test Location',
    tags: ['test', 'business'],
    ...overrides
  }),

  mileageLog: (overrides = {}) => ({
    id: Math.random().toString(36).substr(2, 9),
    date: dateUtils.toISODate(new Date()),
    startOdometer: 10000,
    endOdometer: 10100,
    totalMiles: 100,
    purpose: 'Test Purpose',
    ...overrides
  })
}

// Mock file generators
export const mockFileGenerators = {
  createImageFile: (name: string = 'test.jpg'): File => {
    return new File(['mock-image'], name, { type: 'image/jpeg' })
  },

  createPdfFile: (name: string = 'test.pdf'): File => {
    return new File(['mock-pdf'], name, { type: 'application/pdf' })
  },

  createExcelFile: (name: string = 'test.xlsx'): File => {
    return new File(['mock-excel'], name, { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
  }
}

// Event simulators
export const eventSimulators = {
  click: (element: Element) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    element.dispatchEvent(event)
  },

  change: (element: Element, value: string) => {
    const event = new Event('change', {
      bubbles: true,
      cancelable: true
    })
    ;(element as HTMLInputElement).value = value
    element.dispatchEvent(event)
  },

  submit: (form: HTMLFormElement) => {
    const event = new Event('submit', {
      bubbles: true,
      cancelable: true
    })
    form.dispatchEvent(event)
  }
}

// Test cleanup utilities
export const cleanup = {
  mockReset: (...mocks: Mock[]) => {
    mocks.forEach(mock => mock.mockReset())
  },

  mockClear: (...mocks: Mock[]) => {
    mocks.forEach(mock => mock.mockClear())
  },

  mockRestore: (...mocks: Mock[]) => {
    mocks.forEach(mock => mock.mockRestore())
  },

  localStorage: () => {
    window.localStorage.clear()
  },

  sessionStorage: () => {
    window.sessionStorage.clear()
  },

  allStorage: () => {
    cleanup.localStorage()
    cleanup.sessionStorage()
  }
}

// Assertion helpers
export const assertions = {
  toBeWithinRange: (actual: number, min: number, max: number) => {
    return actual >= min && actual <= max
  },

  toHaveBeenCalledAfter: (laterMock: Mock, earlierMock: Mock) => {
    const laterCalls = laterMock.mock.invocationCallOrder
    const earlierCalls = earlierMock.mock.invocationCallOrder
    return Math.min(...laterCalls) > Math.max(...earlierCalls)
  },

  toMatchMoneyPattern: (str: string) => {
    return /^\$\d+\.\d{2}$/.test(str)
  }
}

export default {
  config: testConfig,
  dateUtils,
  numberUtils,
  mockDataGenerators,
  mockFileGenerators,
  eventSimulators,
  cleanup,
  assertions,
  createMockFetch,
  createMockResponse
}