import { test, expect } from '@playwright/test'

test.describe('Trip Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Navigate to trips page
    await page.goto('/trips')
    await expect(page).toHaveURL(/.*trips/)
  })

  test('should create a new trip', async ({ page }) => {
    // Click add trip button
    await page.getByRole('button', { name: /add trip/i }).click()
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Fill in trip details
    await page.getByLabel(/name/i).fill('Test Business Trip')
    await page.getByLabel(/description/i).fill('Test trip description')
    await page.getByLabel(/start date/i).fill('2025-05-01')
    await page.getByLabel(/end date/i).fill('2025-05-05')
    await page.getByLabel(/budget/i).fill('1000')
    await page.getByLabel(/location/i).fill('New York')
    
    // Add tags
    await page.getByLabel(/tags/i).fill('business')
    await page.keyboard.press('Enter')
    await page.getByLabel(/tags/i).fill('conference')
    await page.keyboard.press('Enter')
    
    // Submit form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify trip was added
    await expect(page.getByText('Test Business Trip')).toBeVisible()
    await expect(page.getByText('New York')).toBeVisible()
    await expect(page.getByText('$1,000.00')).toBeVisible()
  })

  test('should edit an existing trip', async ({ page }) => {
    // Find and click edit button for first trip
    await page.getByRole('button', { name: /edit trip/i }).first().click()
    
    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Update trip details
    await page.getByLabel(/name/i).fill('Updated Business Trip')
    await page.getByLabel(/budget/i).fill('1500')
    
    // Submit form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify trip was updated
    await expect(page.getByText('Updated Business Trip')).toBeVisible()
    await expect(page.getByText('$1,500.00')).toBeVisible()
  })

  test('should add expense to trip', async ({ page }) => {
    // Click on trip to view details
    await page.getByText('Updated Business Trip').click()
    
    // Click add expense button
    await page.getByRole('button', { name: /add expense/i }).click()
    
    // Fill in expense details
    await page.getByLabel(/type/i).selectOption('Food')
    await page.getByLabel(/date/i).fill('2025-05-02')
    await page.getByLabel(/vendor/i).fill('Trip Restaurant')
    await page.getByLabel(/location/i).fill('New York')
    await page.getByLabel(/cost/i).fill('75.50')
    
    // Submit form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify expense was added to trip
    await expect(page.getByText('Trip Restaurant')).toBeVisible()
    await expect(page.getByText('$75.50')).toBeVisible()
    
    // Verify trip total was updated
    await expect(page.getByText(/total expenses: \$75\.50/i)).toBeVisible()
  })

  test('should filter trips', async ({ page }) => {
    // Add another test trip if needed
    await page.getByRole('button', { name: /add trip/i }).click()
    await page.getByLabel(/name/i).fill('Personal Vacation')
    await page.getByLabel(/start date/i).fill('2025-06-01')
    await page.getByLabel(/end date/i).fill('2025-06-07')
    await page.getByLabel(/tags/i).fill('vacation')
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: /save/i }).click()
    
    // Apply filters
    await page.getByRole('button', { name: /filter/i }).click()
    await page.getByLabel(/tag/i).selectOption('business')
    await page.getByRole('button', { name: /apply filters/i }).click()
    
    // Verify filtered results
    await expect(page.getByText('Updated Business Trip')).toBeVisible()
    await expect(page.getByText('Personal Vacation')).not.toBeVisible()
  })

  test('should show trip analytics', async ({ page }) => {
    // Click on trip to view details
    await page.getByText('Updated Business Trip').click()
    
    // Navigate to analytics tab
    await page.getByRole('tab', { name: /analytics/i }).click()
    
    // Verify analytics components are visible
    await expect(page.getByTestId('expense-chart')).toBeVisible()
    await expect(page.getByTestId('expense-summary')).toBeVisible()
    await expect(page.getByTestId('budget-progress')).toBeVisible()
  })

  test('should export trip expenses', async ({ page }) => {
    // Click on trip to view details
    await page.getByText('Updated Business Trip').click()
    
    // Click export button
    await page.getByRole('button', { name: /export/i }).click()
    
    // Select export format
    await page.getByLabel(/format/i).selectOption('excel')
    
    // Download should start automatically
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download/i }).click()
    ])
    
    // Verify download started
    expect(download[0].suggestedFilename()).toMatch(/expenses.*\.xlsx/)
  })

  test('should delete a trip', async ({ page }) => {
    // Store initial trip count
    const initialTrips = await page.getByTestId('trip-card').count()
    
    // Find and click delete button for first trip
    await page.getByRole('button', { name: /delete trip/i }).first().click()
    
    // Confirm deletion in dialog
    await page.getByRole('button', { name: /confirm/i }).click()
    
    // Verify trip was deleted
    const finalTrips = await page.getByTestId('trip-card').count()
    expect(finalTrips).toBe(initialTrips - 1)
  })
})