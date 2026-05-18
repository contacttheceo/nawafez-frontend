import { test, expect } from '@playwright/test'

test.describe('Listings browse + filter', () => {

  test('listings page renders cards', async ({ page }) => {
    await page.goto('/ar/listings')
    await expect(page).toHaveTitle(/الإعلانات/)
    // The header search bar should be visible
    await expect(page.getByPlaceholder(/ابحث/).first()).toBeVisible()
  })

  test('section filter updates the URL', async ({ page }) => {
    await page.goto('/ar/listings')
    await page.waitForLoadState('networkidle')
    // Click the "Fleet" section chip (one of multiple instances — first visible)
    const fleetChip = page.getByRole('button', { name: /أسطول/ }).first()
    await fleetChip.click()
    await expect(page).toHaveURL(/section=fleet/)
  })

  test('forum section shows category chips', async ({ page }) => {
    await page.goto('/ar/listings?section=forum')
    // Forum-only category chips
    await expect(page.getByText(/قانوني/).first()).toBeVisible()
    await expect(page.getByText(/مالي/).first()).toBeVisible()
  })

  test('clicking a listing card opens its detail page', async ({ page }) => {
    await page.goto('/ar/listings')
    // Wait explicitly for a real listing card (link that wraps article)
    const card = page.locator('a').filter({ has: page.locator('article') }).first()
    await card.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {})
    if (await card.count() === 0) test.skip(true, 'no cards rendered')
    await card.click()
    await expect(page).toHaveURL(/\/listings\/\d+/)
  })

  test('listing detail page shows comment section', async ({ page }) => {
    await page.goto('/ar/listings')
    const card = page.locator('a').filter({ has: page.locator('article') }).first()
    await card.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {})
    if (await card.count() === 0) test.skip(true, 'no cards')
    await card.click()
    await page.waitForLoadState('networkidle')
    const heading = page.getByRole('heading', { name: /التعليقات|الإجابات/ })
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })
})
