import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {

  test('redirects root to locale-prefixed URL', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
    expect(page.url()).toMatch(/\/(ar|en)$/)
  })

  test('Arabic homepage shows hero + sections grid', async ({ page }) => {
    await page.goto('/ar')
    await expect(page).toHaveTitle(/نوافذ/)

    // Navbar brand
    await expect(page.locator('header').getByText('نوافذ').first()).toBeVisible()

    // Hero CTA buttons should exist
    const cta = page.getByRole('link', { name: /أضف إعلان/ }).first()
    await expect(cta).toBeVisible()
  })

  test('English homepage uses English locale', async ({ page }) => {
    await page.goto('/en')
    await expect(page).toHaveTitle(/Nawafez/i)
    const html = await page.locator('html')
    await expect(html).toHaveAttribute('lang', 'en')
    await expect(html).toHaveAttribute('dir', 'ltr')
  })

  test('Arabic locale uses RTL direction', async ({ page }) => {
    await page.goto('/ar')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'ar')
    await expect(html).toHaveAttribute('dir', 'rtl')
  })

  test('Locale switcher toggles between ar and en', async ({ page }) => {
    await page.goto('/ar')
    const switchBtn = page.getByRole('button', { name: /^EN$/ }).first()
    await switchBtn.click()
    await page.waitForURL(/\/en/)
    expect(page.url()).toContain('/en')
  })
})
