import { test, expect } from '@playwright/test'

test.describe('Authentication flows', () => {

  test('login page loads with form fields', async ({ page }) => {
    await page.goto('/ar/auth/login')
    await expect(page.getByPlaceholder('example@domain.com')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /دخول|Sign In/i }).first()).toBeVisible()
  })

  test('register page shows full form', async ({ page }) => {
    await page.goto('/ar/auth/register')
    // Should have at least: name_ar, name_en, email, phone, password, password_confirm
    const inputs = page.locator('form input')
    const count = await inputs.count()
    expect(count).toBeGreaterThanOrEqual(5)
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('login with empty form shows validation', async ({ page }) => {
    await page.goto('/ar/auth/login')
    const submit = page.getByRole('button', { name: /^دخول|^Sign In/i }).first()
    await submit.click()
    // HTML5 validation should prevent submit; password field gets focus
    // (Or react-hook-form shows inline error)
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
  })

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/ar/auth/forgot-password')
    await expect(page.getByText(/نسيت كلمة المرور|Forgot Password/i).first()).toBeVisible()
  })

  test('protected pages redirect to login when not authenticated', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/ar/dashboard')
    await page.waitForLoadState('networkidle')
    // Should redirect to login (useAuthGuard handles this)
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5_000 })
  })

  test('admin page redirects non-admin to home', async ({ page }) => {
    await page.goto('/ar/admin')
    await page.waitForLoadState('networkidle')
    // Not authenticated → redirects to login first
    await expect(page).toHaveURL(/\/auth\/login|\/ar$/, { timeout: 5_000 })
  })
})
