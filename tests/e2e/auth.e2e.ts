import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the auth page before each test
    await page.goto('/auth')
  })

  test('should display login form by default', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should switch between login and registration forms', async ({ page }) => {
    // Check initial login form
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()

    // Switch to registration
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()

    // Switch back to login
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('should show validation errors on empty form submission', async ({ page }) => {
    // Try to submit empty login form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Check for validation error messages
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Check for error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Fill in valid test credentials
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Check redirection to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should handle password reset flow', async ({ page }) => {
    // Click forgot password link
    await page.getByRole('link', { name: /forgot password/i }).click()

    // Check reset password form
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()

    // Submit reset password form
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByRole('button', { name: /send reset link/i }).click()

    // Check confirmation message
    await expect(page.getByText(/password reset email sent/i)).toBeVisible()
  })

  test('should handle registration flow', async ({ page }) => {
    // Switch to registration form
    await page.getByRole('link', { name: /sign up/i }).click()

    // Fill in registration form with test data
    await page.getByLabel(/first name/i).fill('Test')
    await page.getByLabel(/last name/i).fill('User')
    await page.getByLabel(/email/i).fill(`test${Date.now()}@example.com`)
    await page.getByLabel(/password/i).fill('TestPassword123!')

    // Submit registration form
    await page.getByRole('button', { name: /sign up/i }).click()

    // Check for success message or redirection
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })
})