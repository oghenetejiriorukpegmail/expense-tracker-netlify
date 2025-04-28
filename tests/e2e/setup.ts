import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Extend the base test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page
}>({
  // Define authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Navigate to auth page
    await page.goto('/auth')

    // Fill in test credentials
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/)

    // Use the authenticated page
    await use(page)
  },
})

// Common test data
export const testData = {
  user: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'testpassword',
    firstName: 'Test',
    lastName: 'User',
  },
  expense: {
    type: 'Food',
    date: '2025-04-28',
    vendor: 'Test Restaurant',
    location: 'Test Location',
    cost: '45.67',
    comments: 'Test expense',
  },
  trip: {
    name: 'Test Business Trip',
    description: 'Test trip description',
    startDate: '2025-05-01',
    endDate: '2025-05-05',
    budget: '1000',
    location: 'New York',
    tags: ['business', 'conference'],
  },
  mileageLog: {
    date: '2025-04-28',
    startOdometer: '10000',
    endOdometer: '10150',
    purpose: 'Client Meeting',
  },
}

// Helper functions
export const helpers = {
  // Wait for loading states
  waitForLoading: async (page: Page) => {
    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' })
  },

  // Fill expense form
  fillExpenseForm: async (page: Page, data = testData.expense) => {
    await page.getByLabel(/type/i).selectOption(data.type)
    await page.getByLabel(/date/i).fill(data.date)
    await page.getByLabel(/vendor/i).fill(data.vendor)
    await page.getByLabel(/location/i).fill(data.location)
    await page.getByLabel(/cost/i).fill(data.cost)
    if (data.comments) {
      await page.getByLabel(/comments/i).fill(data.comments)
    }
  },

  // Fill trip form
  fillTripForm: async (page: Page, data = testData.trip) => {
    await page.getByLabel(/name/i).fill(data.name)
    await page.getByLabel(/description/i).fill(data.description)
    await page.getByLabel(/start date/i).fill(data.startDate)
    await page.getByLabel(/end date/i).fill(data.endDate)
    await page.getByLabel(/budget/i).fill(data.budget)
    await page.getByLabel(/location/i).fill(data.location)
    
    // Add tags
    for (const tag of data.tags) {
      await page.getByLabel(/tags/i).fill(tag)
      await page.keyboard.press('Enter')
    }
  },

  // Fill mileage log form
  fillMileageLogForm: async (page: Page, data = testData.mileageLog) => {
    await page.getByLabel(/date/i).fill(data.date)
    await page.getByLabel(/start odometer/i).fill(data.startOdometer)
    await page.getByLabel(/end odometer/i).fill(data.endOdometer)
    await page.getByLabel(/purpose/i).fill(data.purpose)
  },

  // Upload file
  uploadFile: async (page: Page, selector: string, filePath: string) => {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click(selector),
    ])
    await fileChooser.setFiles(filePath)
  },

  // Wait for download
  waitForDownload: async (page: Page, action: () => Promise<void>) => {
    const downloadPromise = page.waitForEvent('download')
    await action()
    const download = await downloadPromise
    return download
  },

  // Navigate to section
  navigateToSection: async (page: Page, section: string) => {
    await page.getByRole('link', { name: new RegExp(section, 'i') }).click()
    await page.waitForURL(new RegExp(section.toLowerCase()))
  },

  // Clear form
  clearForm: async (page: Page) => {
    const inputs = await page.$$('input:not([type="submit"]), textarea')
    for (const input of inputs) {
      await input.fill('')
    }
  },

  // Get table row count
  getTableRowCount: async (page: Page, tableTestId: string) => {
    return await page.getByTestId(tableTestId).getByRole('row').count()
  },

  // Check toast message
  checkToastMessage: async (page: Page, message: string) => {
    await expect(page.getByRole('alert')).toContainText(message)
  },
}

// Export expect for convenience
export { expect }