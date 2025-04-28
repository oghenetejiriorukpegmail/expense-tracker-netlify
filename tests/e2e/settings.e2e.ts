import { test, expect } from '@playwright/test'

test.describe('Settings and Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Navigate to settings page
    await page.goto('/settings')
    await expect(page).toHaveURL(/.*settings/)
  })

  test('should toggle theme mode', async ({ page }) => {
    // Get initial theme
    const initialTheme = await page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    )
    
    // Toggle theme
    await page.getByRole('switch', { name: /dark mode/i }).click()
    
    // Verify theme changed
    const newTheme = await page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    )
    expect(newTheme).not.toBe(initialTheme)
    
    // Toggle back
    await page.getByRole('switch', { name: /dark mode/i }).click()
    const finalTheme = await page.evaluate(() => 
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    )
    expect(finalTheme).toBe(initialTheme)
  })

  test('should update OCR settings', async ({ page }) => {
    // Navigate to OCR settings tab
    await page.getByRole('tab', { name: /ocr settings/i }).click()
    
    // Update OCR method
    await page.getByLabel(/ocr method/i).selectOption('tesseract')
    
    // Set API key if needed
    await page.getByLabel(/api key/i).fill('test-api-key')
    
    // Update OCR template
    await page.getByLabel(/template/i).selectOption('travel')
    
    // Save changes
    await page.getByRole('button', { name: /save settings/i }).click()
    
    // Verify success message
    await expect(page.getByText(/settings saved/i)).toBeVisible()
    
    // Verify persistence after reload
    await page.reload()
    await expect(page.getByLabel(/ocr method/i)).toHaveValue('tesseract')
    await expect(page.getByLabel(/template/i)).toHaveValue('travel')
  })

  test('should update profile information', async ({ page }) => {
    // Navigate to profile tab
    await page.getByRole('tab', { name: /profile/i }).click()
    
    // Update profile information
    await page.getByLabel(/first name/i).fill('Updated')
    await page.getByLabel(/last name/i).fill('User')
    await page.getByLabel(/phone/i).fill('123-456-7890')
    await page.getByLabel(/bio/i).fill('Test bio information')
    
    // Save changes
    await page.getByRole('button', { name: /save profile/i }).click()
    
    // Verify success message
    await expect(page.getByText(/profile updated/i)).toBeVisible()
    
    // Verify persistence after reload
    await page.reload()
    await expect(page.getByLabel(/first name/i)).toHaveValue('Updated')
    await expect(page.getByLabel(/last name/i)).toHaveValue('User')
    await expect(page.getByLabel(/phone/i)).toHaveValue('123-456-7890')
    await expect(page.getByLabel(/bio/i)).toHaveValue('Test bio information')
  })

  test('should update notification preferences', async ({ page }) => {
    // Navigate to notifications tab
    await page.getByRole('tab', { name: /notifications/i }).click()
    
    // Toggle notification settings
    await page.getByLabel(/email notifications/i).check()
    await page.getByLabel(/expense alerts/i).check()
    await page.getByLabel(/trip reminders/i).uncheck()
    
    // Save changes
    await page.getByRole('button', { name: /save preferences/i }).click()
    
    // Verify success message
    await expect(page.getByText(/preferences saved/i)).toBeVisible()
    
    // Verify persistence after reload
    await page.reload()
    await expect(page.getByLabel(/email notifications/i)).toBeChecked()
    await expect(page.getByLabel(/expense alerts/i)).toBeChecked()
    await expect(page.getByLabel(/trip reminders/i)).not.toBeChecked()
  })

  test('should manage export settings', async ({ page }) => {
    // Navigate to export settings tab
    await page.getByRole('tab', { name: /export settings/i }).click()
    
    // Configure default export settings
    await page.getByLabel(/default format/i).selectOption('excel')
    await page.getByLabel(/include receipts/i).check()
    await page.getByLabel(/group by category/i).check()
    
    // Save changes
    await page.getByRole('button', { name: /save export settings/i }).click()
    
    // Verify success message
    await expect(page.getByText(/export settings saved/i)).toBeVisible()
    
    // Test export with new settings
    await page.getByRole('button', { name: /test export/i }).click()
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download/i }).click()
    ])
    
    expect(download[0].suggestedFilename()).toMatch(/\.xlsx$/)
  })

  test('should handle data privacy settings', async ({ page }) => {
    // Navigate to privacy tab
    await page.getByRole('tab', { name: /privacy/i }).click()
    
    // Configure privacy settings
    await page.getByLabel(/data sharing/i).uncheck()
    await page.getByLabel(/analytics collection/i).uncheck()
    
    // Save changes
    await page.getByRole('button', { name: /save privacy settings/i }).click()
    
    // Verify success message
    await expect(page.getByText(/privacy settings saved/i)).toBeVisible()
    
    // Verify persistence after reload
    await page.reload()
    await expect(page.getByLabel(/data sharing/i)).not.toBeChecked()
    await expect(page.getByLabel(/analytics collection/i)).not.toBeChecked()
  })

  test('should validate profile inputs', async ({ page }) => {
    // Navigate to profile tab
    await page.getByRole('tab', { name: /profile/i }).click()
    
    // Clear required fields
    await page.getByLabel(/first name/i).fill('')
    await page.getByLabel(/last name/i).fill('')
    await page.getByLabel(/email/i).fill('')
    
    // Try to save
    await page.getByRole('button', { name: /save profile/i }).click()
    
    // Verify validation errors
    await expect(page.getByText(/first name is required/i)).toBeVisible()
    await expect(page.getByText(/last name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    
    // Test invalid email
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /save profile/i }).click()
    await expect(page.getByText(/invalid email format/i)).toBeVisible()
  })

  test('should handle API key validation', async ({ page }) => {
    // Navigate to OCR settings tab
    await page.getByRole('tab', { name: /ocr settings/i }).click()
    
    // Enter invalid API key
    await page.getByLabel(/api key/i).fill('invalid-key')
    await page.getByRole('button', { name: /verify key/i }).click()
    
    // Verify error message
    await expect(page.getByText(/invalid api key/i)).toBeVisible()
    
    // Enter valid API key
    await page.getByLabel(/api key/i).fill('test-valid-key')
    await page.getByRole('button', { name: /verify key/i }).click()
    
    // Verify success message
    await expect(page.getByText(/api key verified/i)).toBeVisible()
  })
})