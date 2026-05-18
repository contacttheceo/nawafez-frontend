# Nawafez Tests

Playwright-based test suite covering both **backend API smoke tests** (hitting production directly) and **end-to-end UI flows**.

## Why Playwright for both?
- No PHP CLI needed locally (Freehostia backend, no local PHP)
- One tool, one runner, one report
- Tests can target localhost dev OR production via `BASE_URL`

## Structure

```
tests/
├── api/                   ← HTTP-only smoke tests vs. production
│   └── smoke.spec.ts        12 critical backend contracts
└── e2e/                   ← Full browser UI tests
    ├── homepage.spec.ts     6  locale + RTL + nav
    ├── listings.spec.ts     5  browse, filter, detail navigation
    ├── auth.spec.ts         6  login, register, protected pages
    └── seo.spec.ts          7  sitemap, robots, schema.org, hreflang
                             ── 35 total tests
```

## Running

```bash
# Local dev server + tests (some skip if backend CORS blocks localhost)
npm run test

# Just API smoke tests (always hit production)
npm run test:smoke

# Just E2E UI tests
npm run test:e2e

# Everything against production (RECOMMENDED — 35/35 pass)
npm run test:prod

# Interactive UI mode for debugging
npm run test:ui

# View HTML report after a run
npm run test:report
```

## What's covered

### Backend API (12 tests, hits production)
- `/api/stats` returns counters
- `/api/listings` pagination + filters
- `/api/listings/featured`
- `/api/listings/{id}` single + 404
- `/api/auth/login` validation + wrong-credentials
- `/api/admin/dashboard` gated to admin
- CORS for nwafizlogi.com origin
- Comments + bids endpoints

### Frontend UI (23 tests)
- Locale: `/` redirects to `/ar`, RTL vs LTR direction, locale switcher
- Listings: card rendering, section filter, forum category chips, detail navigation
- Auth: form rendering, protected-page redirect to login, admin gate
- SEO: sitemap.xml served, robots.txt served, JSON-LD types present (Org, WebSite, FAQPage, Product/JobPosting, BreadcrumbList), hreflang ar/en/x-default, canonical, OG image

## Notes & limitations

- **Local dev limitation**: 4 tests (listing-detail navigation + JSON-LD on detail page) get skipped on `npm run test` because the local dev hits production API from `http://localhost:3000` which isn't in the backend CORS allowlist. Running against production via `npm run test:prod` covers these. Add localhost to backend CORS if you want full local coverage.
- **No PHPUnit / no Laravel**: backend logic is tested via HTTP only (smoke). For deeper unit tests we'd need PHP locally or GitHub Actions CI.
- **No GitHub Actions yet**: tests run only locally. Easy to wire later (`.github/workflows/test.yml`).

## Adding a new test
- API check → `tests/api/smoke.spec.ts`
- UI flow → `tests/e2e/<topic>.spec.ts`

Use `await page.waitForLoadState('networkidle')` after navigation when data is fetched client-side.
