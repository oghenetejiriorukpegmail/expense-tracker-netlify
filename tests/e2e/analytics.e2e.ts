import { test, expect } from '@playwright/test'

test.describe('Analytics Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should display expense summary chart', async ({ page }) => {
    // Verify expense summary chart is visible
    await expect(page.getByTestId('expense-summary-chart')).toBeVisible()
    
    // Check chart elements
    await expect(page.getByRole('img', { name: /expense summary/i })).toBeVisible()
    await expect(page.getByText(/total expenses/i)).toBeVisible()
    await expect(page.getByText(/by category/i)).toBeVisible()
  })

  test('should filter expense chart by date range', async ({ page }) => {
    // Open date range picker
    await page.getByRole('button', { name: /date range/i }).click()
    
    // Select last 30 days
    await page.getByRole('button', { name: /last 30 days/i }).click()
    
    // Verify chart updates
    await expect(page.getByTestId('expense-summary-chart')).toBeVisible()
    await expect(page.getByText(/last 30 days/i)).toBeVisible()
  })

  test('should display expense trend chart', async ({ page }) => {
    // Navigate to trends section
    await page.getByRole('tab', { name: /trends/i }).click()
    
    // Verify trend chart is visible
    await expect(page.getByTestId('expense-trend-chart')).toBeVisible()
    
    // Check trend line elements
    await expect(page.getByRole('img', { name: /expense trend/i })).toBeVisible()
    await expect(page.getByText(/monthly trend/i)).toBeVisible()
  })

  test('should generate expense reports', async ({ page }) => {
    // Navigate to reports section
    await page.getByRole('tab', { name: /reports/i }).click()
    
    // Configure report
    await page.getByLabel(/report type/i).selectOption('expense-summary')
    await page.getByLabel(/date range/i).selectOption('last-month')
    await page.getByLabel(/format/i).selectOption('excel')
    
    // Generate report
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /generate report/i }).click()
    ])
    
    // Verify download started
    expect(download[0].suggestedFilename()).toMatch(/expense-report.*\.xlsx/)
  })

  test('should display budget progress', async ({ page }) => {
    // Navigate to budgets section
    await page.getByRole('tab', { name: /budgets/i }).click()
    
    // Verify budget components
    await expect(page.getByTestId('budget-progress-chart')).toBeVisible()
    await expect(page.getByText(/budget overview/i)).toBeVisible()
    
    // Check progress bars
    await expect(page.getByRole('progressbar')).toBeVisible()
    await expect(page.getByText(/remaining budget/i)).toBeVisible()
  })

  test('should display category breakdown', async ({ page }) => {
    // Navigate to categories section
    await page.getByRole('tab', { name: /categories/i }).click()
    
    // Verify category chart
    await expect(page.getByTestId('category-breakdown-chart')).toBeVisible()
    
    // Check category elements
    await expect(page.getByText(/food & dining/i)).toBeVisible()
    await expect(page.getByText(/transportation/i)).toBeVisible()
    await expect(page.getByText(/lodging/i)).toBeVisible()
  })

  test('should compare expenses across periods', async ({ page }) => {
    // Navigate to comparison section
    await page.getByRole('tab', { name: /comparison/i }).click()
    
    // Select comparison periods
    await page.getByLabel(/period 1/i).selectOption('last-month')
    await page.getByLabel(/period 2/i).selectOption('this-month')
    
    // Verify comparison chart
    await expect(page.getByTestId('expense-comparison-chart')).toBeVisible()
    await expect(page.getByText(/month over month/i)).toBeVisible()
  })

  test('should export analytics data', async ({ page }) => {
    // Click export button
    await page.getByRole('button', { name: /export analytics/i }).click()
    
    // Configure export
    await page.getByLabel(/date range/i).selectOption('last-month')
    await page.getByLabel(/include charts/i).check()
    await page.getByLabel(/format/i).selectOption('pdf')
    
    // Export data
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export/i }).click()
    ])
    
    // Verify download started
    expect(download[0].suggestedFilename()).toMatch(/analytics-report.*\.pdf/)
  })

  test('should customize chart appearance', async ({ page }) => {
    // Open chart settings
    await page.getByRole('button', { name: /chart settings/i }).click()
    
    // Customize appearance
    await page.getByLabel(/chart type/i).selectOption('bar')
    await page.getByLabel(/color scheme/i).selectOption('blue')
    await page.getByLabel(/show legend/i).check()
    
    // Apply changes
    await page.getByRole('button', { name: /apply/i }).click()
    
    // Verify chart updates
    await expect(page.getByTestId('expense-summary-chart')).toHaveAttribute('data-type', 'bar')
    await expect(page.getByTestId('chart-legend')).toBeVisible()
  })

  test('should handle data refresh', async ({ page }) => {
    // Click refresh button
    await page.getByRole('button', { name: /refresh/i }).click()
    
    // Verify loading state
    await expect(page.getByText(/refreshing data/i)).toBeVisible()
    
    // Verify refresh complete
    await expect(page.getByText(/data updated/i)).toBeVisible()
    await expect(page.getByTestId('expense-summary-chart')).toBeVisible()
  })
})