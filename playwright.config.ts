import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for Nawafez.
 *
 * Two test suites:
 *   1. tests/api/*       — backend smoke tests hitting production directly
 *   2. tests/e2e/*       — full UI flows against either local dev server
 *                          or a deployed URL (BASE_URL env var)
 *
 * Usage:
 *   npm run test            → all tests, against local dev server
 *   npm run test:smoke      → only API smoke tests (hits prod backend)
 *   npm run test:e2e        → only E2E tests
 *   BASE_URL=https://www.nwafizlogi.com npm run test:e2e
 *                           → run E2E against production
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const API_URL  = process.env.API_URL  ?? 'https://nwafiz.creativealphat.com'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  // Default expectations — Freehostia (shared hosting) can be slow,
  // so generous timeouts for cold starts.
  expect: {
    timeout: 15_000,
  },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 45_000,
    extraHTTPHeaders: {
      'X-Test-Source': 'playwright',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start Next.js dev server for E2E tests when running locally
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})

// Re-export for test files that need the API URL
export { API_URL }
