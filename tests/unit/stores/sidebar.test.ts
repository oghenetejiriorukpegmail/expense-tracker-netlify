import { beforeEach, describe, expect, it } from 'vitest'
import { useSidebarStore } from '../../../client/src/lib/store'

describe('Sidebar Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useSidebarStore.setState({
      isOpen: false
    })
  })

  describe('Initial State', () => {
    it('should initialize with sidebar closed', () => {
      const store = useSidebarStore.getState()
      expect(store.isOpen).toBe(false)
    })
  })

  describe('Toggle Functionality', () => {
    it('should toggle sidebar state', () => {
      const store = useSidebarStore.getState()
      
      // Toggle open
      store.toggle()
      expect(useSidebarStore.getState().isOpen).toBe(true)
      
      // Toggle closed
      store.toggle()
      expect(useSidebarStore.getState().isOpen).toBe(false)
    })

    it('should close sidebar when already open', () => {
      const store = useSidebarStore.getState()
      
      // Open sidebar
      store.toggle()
      expect(useSidebarStore.getState().isOpen).toBe(true)
      
      // Close sidebar
      store.close()
      expect(useSidebarStore.getState().isOpen).toBe(false)
    })

    it('should keep sidebar closed when closing already closed sidebar', () => {
      const store = useSidebarStore.getState()
      
      // Sidebar starts closed
      expect(store.isOpen).toBe(false)
      
      // Close sidebar when already closed
      store.close()
      expect(useSidebarStore.getState().isOpen).toBe(false)
    })
  })

  describe('State Management', () => {
    it('should maintain state after multiple toggles', () => {
      const store = useSidebarStore.getState()
      
      // Multiple toggles
      store.toggle() // open
      store.toggle() // close
      store.toggle() // open
      expect(useSidebarStore.getState().isOpen).toBe(true)
      
      store.toggle() // close
      expect(useSidebarStore.getState().isOpen).toBe(false)
    })

    it('should handle rapid state changes', () => {
      const store = useSidebarStore.getState()
      
      // Rapid state changes
      store.toggle() // open
      store.close()  // close
      store.toggle() // open
      store.close()  // close
      
      expect(useSidebarStore.getState().isOpen).toBe(false)
    })
  })
})