import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Expense Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should create a new expense', async ({ page }) => {
    // Click add expense button
    await page.getByRole('button', { name: /add expense/i }).click()
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Fill in expense details
    await page.getByLabel(/type/i).selectOption('Food')
    await page.getByLabel(/date/i).fill('2025-04-28')
    await page.getByLabel(/vendor/i).fill('Test Restaurant')
    await page.getByLabel(/location/i).fill('Test Location')
    await page.getByLabel(/cost/i).fill('45.67')
    await page.getByLabel(/comments/i).fill('Test expense comment')
    
    // Submit form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify expense was added
    await expect(page.getByText('Test Restaurant')).toBeVisible()
    await expect(page.getByText('$45.67')).toBeVisible()
  })

  test('should edit an existing expense', async ({ page }) => {
    // Find and click edit button for first expense
    await page.getByRole('button', { name: /edit expense/i }).first().click()
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Update expense details
    await page.getByLabel(/vendor/i).fill('Updated Restaurant')
    await page.getByLabel(/cost/i).fill('55.67')
    
    // Submit form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify expense was updated
    await expect(page.getByText('Updated Restaurant')).toBeVisible()
    await expect(page.getByText('$55.67')).toBeVisible()
  })

  test('should delete an expense', async ({ page }) => {
    // Store initial expense count
    const initialExpenses = await page.getByTestId('expense-row').count()
    
    // Find and click delete button for first expense
    await page.getByRole('button', { name: /delete expense/i }).first().click()
    
    // Confirm deletion in dialog
    await page.getByRole('button', { name: /confirm/i }).click()
    
    // Verify expense was deleted
    const finalExpenses = await page.getByTestId('expense-row').count()
    expect(finalExpenses).toBe(initialExpenses - 1)
  })

  test('should upload receipt for an expense', async ({ page }) => {
    // Create a new expense first
    await page.getByRole('button', { name: /add expense/i }).click()
    await page.getByLabel(/type/i).selectOption('Food')
    await page.getByLabel(/date/i).fill('2025-04-28')
    await page.getByLabel(/vendor/i).fill('Receipt Test Restaurant')
    await page.getByLabel(/location/i).fill('Test Location')
    await page.getByLabel(/cost/i).fill('75.67')
    
    // Upload receipt
    const receiptPath = path.join(__dirname, '../../Receipt sample.jpg')
    await page.getByLabel(/upload receipt/i).setInputFiles(receiptPath)
    
    // Wait for upload to complete
    await expect(page.getByText(/upload complete/i)).toBeVisible()
    
    // Save expense
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify receipt thumbnail is visible
    await expect(page.getByRole('img', { name: /receipt thumbnail/i })).toBeVisible()
  })

  test('should view receipt in viewer', async ({ page }) => {
    // Find and click receipt thumbnail
    await page.getByRole('img', { name: /receipt thumbnail/i }).first().click()
    
    // Verify receipt viewer opened
    await expect(page.getByRole('dialog', { name: /receipt viewer/i })).toBeVisible()
    await expect(page.getByRole('img', { name: /receipt/i })).toBeVisible()
    
    // Close viewer
    await page.getByRole('button', { name: /close/i }).click()
    await expect(page.getByRole('dialog', { name: /receipt viewer/i })).not.toBeVisible()
  })

  test('should batch upload receipts', async ({ page }) => {
    // Click batch upload button
    await page.getByRole('button', { name: /batch upload/i }).click()
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Upload multiple receipts
    const receiptPath = path.join(__dirname, '../../Receipt sample.jpg')
    await page.getByLabel(/upload receipts/i).setInputFiles([receiptPath, receiptPath])
    
    // Wait for uploads to complete
    await expect(page.getByText(/2 receipts uploaded/i)).toBeVisible()
    
    // Process uploads
    await page.getByRole('button', { name: /process receipts/i }).click()
    
    // Wait for processing to complete and verify new expenses
    await expect(page.getByText(/processing complete/i)).toBeVisible()
    await expect(page.getByTestId('expense-row')).toHaveCount(2)
  })

  test('should filter expenses', async ({ page }) => {
    // Add test expenses if needed
    await page.getByRole('button', { name: /add expense/i }).click()
    await page.getByLabel(/type/i).selectOption('Food')
    await page.getByLabel(/vendor/i).fill('Filter Test Restaurant')
    await page.getByLabel(/cost/i).fill('85.67')
    await page.getByRole('button', { name: /save/i }).click()
    
    // Apply filters
    await page.getByRole('button', { name: /filter/i }).click()
    await page.getByLabel(/type/i).selectOption('Food')
    await page.getByRole('button', { name: /apply filters/i }).click()
    
    // Verify filtered results
    await expect(page.getByText('Filter Test Restaurant')).toBeVisible()
    await expect(page.getByText(/no transportation expenses/i)).toBeVisible()
  })
})