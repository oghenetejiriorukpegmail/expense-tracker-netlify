import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Mileage Log Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Navigate to mileage logs page
    await page.goto('/mileage-logs')
    await expect(page).toHaveURL(/.*mileage-logs/)
  })

  test('should create a new mileage log', async ({ page }) => {
    // Click add mileage log button
    await page.getByRole('button', { name: /add mileage log/i }).click()
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Fill in mileage log details
    await page.getByLabel(/date/i).fill('2025-04-28')
    await page.getByLabel(/start odometer/i).fill('10000')
    await page.getByLabel(/end odometer/i).fill('10150')
    await page.getByLabel(/purpose/i).fill('Client Meeting')
    
    // Upload odometer images
    const imagePath = path.join(__dirname, '../../Receipt sample.jpg')
    await page.getByLabel(/start odometer image/i).setInputFiles(imagePath)
    await page.getByLabel(/end odometer image/i).setInputFiles(imagePath)
    
    // Wait for uploads to complete
    await expect(page.getByText(/uploads complete/i)).toBeVisible()
    
    // Submit form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify mileage log was added
    await expect(page.getByText('150.0 miles')).toBeVisible()
    await expect(page.getByText('Client Meeting')).toBeVisible()
  })

  test('should edit an existing mileage log', async ({ page }) => {
    // Find and click edit button for first mileage log
    await page.getByRole('button', { name: /edit mileage log/i }).first().click()
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Update mileage log details
    await page.getByLabel(/purpose/i).fill('Updated Client Meeting')
    await page.getByLabel(/end odometer/i).fill('10200')
    
    // Submit form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify mileage log was updated
    await expect(page.getByText('200.0 miles')).toBeVisible()
    await expect(page.getByText('Updated Client Meeting')).toBeVisible()
  })

  test('should associate mileage log with trip', async ({ page }) => {
    // Create a new trip first
    await page.goto('/trips')
    await page.getByRole('button', { name: /add trip/i }).click()
    await page.getByLabel(/name/i).fill('Business Trip')
    await page.getByLabel(/start date/i).fill('2025-04-28')
    await page.getByLabel(/end date/i).fill('2025-04-30')
    await page.getByRole('button', { name: /save/i }).click()
    
    // Return to mileage logs and create new log
    await page.goto('/mileage-logs')
    await page.getByRole('button', { name: /add mileage log/i }).click()
    
    // Fill in details with trip association
    await page.getByLabel(/date/i).fill('2025-04-28')
    await page.getByLabel(/start odometer/i).fill('10200')
    await page.getByLabel(/end odometer/i).fill('10300')
    await page.getByLabel(/purpose/i).fill('Trip Travel')
    await page.getByLabel(/trip/i).selectOption('Business Trip')
    
    // Submit form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify trip association
    await expect(page.getByText('Business Trip')).toBeVisible()
  })

  test('should view odometer images', async ({ page }) => {
    // Find and click image thumbnail
    await page.getByRole('img', { name: /start odometer/i }).first().click()
    
    // Verify image viewer opened
    await expect(page.getByRole('dialog', { name: /image viewer/i })).toBeVisible()
    await expect(page.getByRole('img', { name: /odometer reading/i })).toBeVisible()
    
    // Close viewer
    await page.getByRole('button', { name: /close/i }).click()
    await expect(page.getByRole('dialog', { name: /image viewer/i })).not.toBeVisible()
  })

  test('should filter mileage logs', async ({ page }) => {
    // Open filter panel
    await page.getByRole('button', { name: /filter/i }).click()
    
    // Set date range
    await page.getByLabel(/start date/i).fill('2025-04-01')
    await page.getByLabel(/end date/i).fill('2025-04-30')
    
    // Filter by trip
    await page.getByLabel(/trip/i).selectOption('Business Trip')
    
    // Apply filters
    await page.getByRole('button', { name: /apply filters/i }).click()
    
    // Verify filtered results
    await expect(page.getByText('Business Trip')).toBeVisible()
    await expect(page.getByText('Trip Travel')).toBeVisible()
  })

  test('should generate mileage report', async ({ page }) => {
    // Click generate report button
    await page.getByRole('button', { name: /generate report/i }).click()
    
    // Configure report
    await page.getByLabel(/date range/i).selectOption('this-month')
    await page.getByLabel(/format/i).selectOption('pdf')
    
    // Generate report
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download/i }).click()
    ])
    
    // Verify download started
    expect(download[0].suggestedFilename()).toMatch(/mileage-report.*\.pdf/)
  })

  test('should delete a mileage log', async ({ page }) => {
    // Store initial log count
    const initialLogs = await page.getByTestId('mileage-log-row').count()
    
    // Find and click delete button for first log
    await page.getByRole('button', { name: /delete mileage log/i }).first().click()
    
    // Confirm deletion in dialog
    await page.getByRole('button', { name: /confirm/i }).click()
    
    // Verify log was deleted
    const finalLogs = await page.getByTestId('mileage-log-row').count()
    expect(finalLogs).toBe(initialLogs - 1)
  })

  test('should validate mileage log inputs', async ({ page }) => {
    // Click add mileage log button
    await page.getByRole('button', { name: /add mileage log/i }).click()
    
    // Try to submit empty form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify validation errors
    await expect(page.getByText(/date is required/i)).toBeVisible()
    await expect(page.getByText(/start odometer is required/i)).toBeVisible()
    await expect(page.getByText(/end odometer is required/i)).toBeVisible()
    
    // Try invalid odometer values
    await page.getByLabel(/start odometer/i).fill('1000')
    await page.getByLabel(/end odometer/i).fill('500')
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify validation error
    await expect(page.getByText(/end odometer must be greater than start odometer/i)).toBeVisible()
  })
})