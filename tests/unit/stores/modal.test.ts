import { beforeEach, describe, expect, it } from 'vitest'
import { useModalStore } from '../../../client/src/lib/store'

// Define minimal interfaces for test data
interface Trip {
  id: number
  name: string
  startDate: string
  endDate: string
  userId: string
}

interface Expense {
  id: number
  userId: string
  type: string
  date: string
  vendor: string
  cost: number
  tripName: string
}

interface MileageLog {
  id: number
  userId: string
  tripId: number
  date: string
  startOdometer: number
  endOdometer: number
  totalMiles: number
  purpose: string
}

describe('Modal Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useModalStore.setState({
      addExpenseOpen: false,
      addTripOpen: false,
      editTripOpen: false,
      editingTrip: null,
      editExpenseOpen: false,
      editingExpense: null,
      batchUploadOpen: false,
      batchUploadTripId: null,
      batchUploadTripName: null,
      receiptViewerOpen: false,
      currentReceiptUrl: null,
      defaultTripName: null,
      addEditMileageLogOpen: false,
      editingMileageLog: null,
      mileageLogTripId: null,
      exportExpensesOpen: false
    })
  })

  describe('Initial State', () => {
    it('should initialize with all modals closed', () => {
      const store = useModalStore.getState()
      expect(store.addExpenseOpen).toBe(false)
      expect(store.addTripOpen).toBe(false)
      expect(store.editTripOpen).toBe(false)
      expect(store.editExpenseOpen).toBe(false)
      expect(store.batchUploadOpen).toBe(false)
      expect(store.receiptViewerOpen).toBe(false)
      expect(store.addEditMileageLogOpen).toBe(false)
      expect(store.exportExpensesOpen).toBe(false)
    })

    it('should initialize with all editing states as null', () => {
      const store = useModalStore.getState()
      expect(store.editingTrip).toBeNull()
      expect(store.editingExpense).toBeNull()
      expect(store.editingMileageLog).toBeNull()
      expect(store.batchUploadTripId).toBeNull()
      expect(store.batchUploadTripName).toBeNull()
      expect(store.currentReceiptUrl).toBeNull()
      expect(store.defaultTripName).toBeNull()
      expect(store.mileageLogTripId).toBeNull()
    })
  })

  describe('Add Expense Modal', () => {
    it('should toggle add expense modal', () => {
      const store = useModalStore.getState()
      
      store.toggleAddExpense()
      expect(store.addExpenseOpen).toBe(true)
      expect(store.defaultTripName).toBeNull()
      
      store.toggleAddExpense()
      expect(store.addExpenseOpen).toBe(false)
      expect(store.defaultTripName).toBeNull()
    })

    it('should set default trip name when provided', () => {
      const store = useModalStore.getState()
      const tripName = 'Business Trip'
      
      store.toggleAddExpense(tripName)
      expect(store.addExpenseOpen).toBe(true)
      expect(store.defaultTripName).toBe(tripName)
    })

    it('should close other modals when opening add expense modal', () => {
      const store = useModalStore.getState()
      
      // Open another modal first
      store.toggleAddTrip()
      expect(store.addTripOpen).toBe(true)
      
      // Open add expense modal
      store.toggleAddExpense()
      expect(store.addExpenseOpen).toBe(true)
      expect(store.addTripOpen).toBe(false)
    })
  })

  describe('Edit Trip Modal', () => {
    const mockTrip: Trip = {
      id: 1,
      name: 'Test Trip',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      userId: 'user123'
    }

    it('should toggle edit trip modal with trip data', () => {
      const store = useModalStore.getState()
      
      store.toggleEditTrip(mockTrip)
      expect(store.editTripOpen).toBe(true)
      expect(store.editingTrip).toBe(mockTrip)
      
      store.toggleEditTrip()
      expect(store.editTripOpen).toBe(false)
      expect(store.editingTrip).toBeNull()
    })

    it('should close other modals when opening edit trip modal', () => {
      const store = useModalStore.getState()
      
      // Open another modal first
      store.toggleAddExpense()
      expect(store.addExpenseOpen).toBe(true)
      
      // Open edit trip modal
      store.toggleEditTrip(mockTrip)
      expect(store.editTripOpen).toBe(true)
      expect(store.addExpenseOpen).toBe(false)
    })
  })

  describe('Batch Upload Modal', () => {
    const mockTripData = {
      id: 1,
      name: 'Test Trip'
    }

    it('should toggle batch upload modal with trip data', () => {
      const store = useModalStore.getState()
      
      store.toggleBatchUpload(mockTripData)
      expect(store.batchUploadOpen).toBe(true)
      expect(store.batchUploadTripId).toBe(mockTripData.id)
      expect(store.batchUploadTripName).toBe(mockTripData.name)
      
      store.toggleBatchUpload()
      expect(store.batchUploadOpen).toBe(false)
      expect(store.batchUploadTripId).toBeNull()
      expect(store.batchUploadTripName).toBeNull()
    })
  })

  describe('Receipt Viewer', () => {
    it('should open and close receipt viewer', () => {
      const store = useModalStore.getState()
      const receiptUrl = 'https://example.com/receipt.jpg'
      
      store.openReceiptViewer(receiptUrl)
      expect(store.receiptViewerOpen).toBe(true)
      expect(store.currentReceiptUrl).toBe(receiptUrl)
      
      store.closeReceiptViewer()
      expect(store.receiptViewerOpen).toBe(false)
      expect(store.currentReceiptUrl).toBeNull()
    })
  })

  describe('Mileage Log Modal', () => {
    const mockMileageLog: MileageLog = {
      id: 1,
      userId: 'user123',
      tripId: 1,
      date: new Date().toISOString(),
      startOdometer: 1000,
      endOdometer: 1100,
      totalMiles: 100,
      purpose: 'Business Travel'
    }

    it('should toggle mileage log modal with log data', () => {
      const store = useModalStore.getState()
      
      store.toggleAddEditMileageLog({ log: mockMileageLog })
      expect(store.addEditMileageLogOpen).toBe(true)
      expect(store.editingMileageLog).toBe(mockMileageLog)
      
      store.toggleAddEditMileageLog()
      expect(store.addEditMileageLogOpen).toBe(false)
      expect(store.editingMileageLog).toBeNull()
    })

    it('should set trip ID when adding new mileage log', () => {
      const store = useModalStore.getState()
      const tripId = 1
      
      store.toggleAddEditMileageLog({ tripId })
      expect(store.addEditMileageLogOpen).toBe(true)
      expect(store.mileageLogTripId).toBe(tripId)
    })
  })

  describe('Export Modal', () => {
    it('should toggle export expenses modal', () => {
      const store = useModalStore.getState()
      
      store.toggleExportExpenses()
      expect(store.exportExpensesOpen).toBe(true)
      
      store.toggleExportExpenses()
      expect(store.exportExpensesOpen).toBe(false)
    })
  })

  describe('Close All Modals', () => {
    it('should close all modals and reset all states', () => {
      const store = useModalStore.getState()
      
      // Open various modals and set states
      store.toggleAddExpense('Trip 1')
      store.toggleEditTrip({ id: 1, name: 'Trip 1', startDate: '', endDate: '', userId: 'user1' })
      
      // Close all
      store.closeAll()
      
      // Verify all states are reset
      expect(store.addExpenseOpen).toBe(false)
      expect(store.addTripOpen).toBe(false)
      expect(store.editTripOpen).toBe(false)
      expect(store.editingTrip).toBeNull()
      expect(store.editExpenseOpen).toBe(false)
      expect(store.editingExpense).toBeNull()
      expect(store.batchUploadOpen).toBe(false)
      expect(store.batchUploadTripId).toBeNull()
      expect(store.batchUploadTripName).toBeNull()
      expect(store.receiptViewerOpen).toBe(false)
      expect(store.currentReceiptUrl).toBeNull()
      expect(store.defaultTripName).toBeNull()
      expect(store.addEditMileageLogOpen).toBe(false)
      expect(store.editingMileageLog).toBeNull()
      expect(store.mileageLogTripId).toBeNull()
      expect(store.exportExpensesOpen).toBe(false)
    })
  })
})