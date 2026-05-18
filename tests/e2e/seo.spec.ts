import { test, expect } from '@playwright/test'

test.describe('SEO infrastructure', () => {

  test('/sitemap.xml is valid XML with URLs', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const headers = res.headers()
    expect(headers['content-type']).toMatch(/xml/)
    const body = await res.text()
    expect(body).toContain('<urlset')
    expect(body).toContain('<loc>')
    // Both locales should be present
    expect(body).toContain('/ar')
    expect(body).toContain('/en')
  })

  test('/robots.txt points to sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/User-Agent:\s*\*/i)
    expect(body).toMatch(/Sitemap:\s*https?:\/\//i)
    expect(body).toContain('Disallow:')
  })

  test('homepage has Organization + WebSite JSON-LD', async ({ page }) => {
    await page.goto('/ar')
    const ldScripts = await page.locator('script[type="application/ld+json"]').allInnerTexts()
    const joined = ldScripts.join(' ')
    expect(joined).toContain('"@type":"Organization"')
    expect(joined).toContain('"@type":"WebSite"')
  })

  test('FAQ page has FAQPage JSON-LD with questions', async ({ page }) => {
    await page.goto('/ar/faq')
    const ldScripts = await page.locator('script[type="application/ld+json"]').allInnerTexts()
    const joined = ldScripts.join(' ')
    expect(joined).toContain('"@type":"FAQPage"')
    expect(joined).toContain('"@type":"Question"')
    expect(joined).toContain('"@type":"Answer"')
  })

  test('listing detail page has Product/JobPosting + Breadcrumb JSON-LD', async ({ page }) => {
    await page.goto('/ar/listings')
    const card = page.locator('a').filter({ has: page.locator('article') }).first()
    await card.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {})
    if (await card.count() === 0) test.skip(true, 'no listings')
    await card.click()
    await page.waitForLoadState('networkidle')

    const ldScripts = await page.locator('script[type="application/ld+json"]').allInnerTexts()
    const joined = ldScripts.join(' ')
    expect(joined).toContain('"@type":"BreadcrumbList"')
    expect(joined).toMatch(/"@type":"(Product|JobPosting|DiscussionForumPosting)"/)
  })

  test('every page has hreflang for ar + en + x-default', async ({ page }) => {
    await page.goto('/ar')
    // Next.js may emit hreflang twice (once from layout, once from metadata
    // alternates). Both are valid; Google deduplicates. Just check at-least-one.
    await expect(page.locator('link[hreflang="ar"]').first()).toBeAttached()
    await expect(page.locator('link[hreflang="en"]').first()).toBeAttached()
    await expect(page.locator('link[hreflang="x-default"]').first()).toBeAttached()
  })

  test('listing detail page has canonical + OG image', async ({ page }) => {
    await page.goto('/ar/listings')
    const card = page.locator('a').filter({ has: page.locator('article') }).first()
    await card.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {})
    if (await card.count() === 0) test.skip(true, 'no listings')
    await card.click()
    await page.waitForLoadState('networkidle')

    const canonical = page.locator('link[rel="canonical"]').first()
    await expect(canonical).toBeAttached()

    const ogImage = page.locator('meta[property="og:image"]').first()
    await expect(ogImage).toHaveAttribute('content', /https?:\/\/.+\.(jpg|jpeg|png|webp)/i)
  })
})
