import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from '../../../client/src/lib/store'

describe('Settings Store', () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  }

  // Mock document.documentElement
  const documentElementMock = {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    }
  }

  beforeEach(() => {
    // Reset store
    useSettingsStore.setState({
      theme: 'light',
      ocrMethod: 'gemini',
      ocrApiKey: null,
      ocrTemplate: 'travel'
    })

    // Reset mocks
    vi.clearAllMocks()

    // Setup mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    Object.defineProperty(window, 'document', {
      value: {
        documentElement: documentElementMock
      },
      writable: true
    })
  })

  describe('Theme Management', () => {
    it('should initialize with default light theme', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useSettingsStore.getState()
      expect(store.theme).toBe('light')
    })

    it('should initialize with stored theme', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const store = useSettingsStore.getState()
      expect(store.theme).toBe('dark')
    })

    it('should set theme and update localStorage', () => {
      const store = useSettingsStore.getState()
      store.setTheme('dark')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
      expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
      expect(useSettingsStore.getState().theme).toBe('dark')
    })

    it('should toggle theme', () => {
      const store = useSettingsStore.getState()
      store.toggleTheme()

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
      expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark')
      expect(useSettingsStore.getState().theme).toBe('dark')

      store.toggleTheme()

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
      expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark')
      expect(useSettingsStore.getState().theme).toBe('light')
    })
  })

  describe('OCR Settings', () => {
    it('should initialize with default OCR method', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useSettingsStore.getState()
      expect(store.ocrMethod).toBe('gemini')
    })

    it('should set OCR method and update localStorage', () => {
      const store = useSettingsStore.getState()
      store.setOcrMethod('tesseract')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('ocrMethod', 'tesseract')
      expect(useSettingsStore.getState().ocrMethod).toBe('tesseract')
    })

    it('should set OCR API key and update localStorage', () => {
      const store = useSettingsStore.getState()
      const apiKey = 'test-api-key'
      store.setOcrApiKey(apiKey)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('ocrApiKey', apiKey)
      expect(useSettingsStore.getState().ocrApiKey).toBe(apiKey)
    })

    it('should remove OCR API key from localStorage when set to null', () => {
      const store = useSettingsStore.getState()
      store.setOcrApiKey(null)

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ocrApiKey')
      expect(useSettingsStore.getState().ocrApiKey).toBeNull()
    })

    it('should set OCR template and update localStorage', () => {
      const store = useSettingsStore.getState()
      store.setOcrTemplate('travel')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('ocrTemplate', 'travel')
      expect(useSettingsStore.getState().ocrTemplate).toBe('travel')
    })
  })
})