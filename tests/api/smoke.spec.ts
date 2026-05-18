import { test, expect, request } from '@playwright/test'

/**
 * Backend smoke tests — hit production directly via HTTPS.
 * Catches regressions in the Laravel backend without needing PHP locally.
 *
 * These tests are READ-ONLY where possible. Write operations
 * (login attempt, bookmark, etc.) use known-invalid credentials so they
 * never affect real data.
 */

const API_URL = process.env.API_URL ?? 'https://nwafiz.creativealphat.com'

test.describe('Backend API @smoke', () => {

  test('GET /api/stats returns counts', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/stats`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('total_listings')
    expect(json).toHaveProperty('total_users')
    expect(json).toHaveProperty('sections')
    expect(typeof json.total_listings).toBe('number')
    expect(json.sections).toMatchObject({
      ma: expect.any(Number),
      fleet: expect.any(Number),
      contracts: expect.any(Number),
      jobs: expect.any(Number),
      forum: expect.any(Number),
    })
  })

  test('GET /api/listings returns paginated active listings', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/listings`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('data')
    expect(Array.isArray(json.data)).toBe(true)
    expect(json).toHaveProperty('current_page')
    expect(json).toHaveProperty('last_page')
    if (json.data.length > 0) {
      const first = json.data[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('title_ar')
      expect(first).toHaveProperty('section')
      expect(first.status).toBe('active')
    }
  })

  test('GET /api/listings/featured returns up to 6 featured', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/listings/featured`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeLessThanOrEqual(6)
    for (const listing of json.data) {
      expect(listing.is_featured).toBe(true)
    }
  })

  test('GET /api/listings supports section + limit filter', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/listings?section=fleet&limit=5`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
    for (const listing of json.data) {
      expect(listing.section).toBe('fleet')
    }
  })

  test('GET /api/listings/{id} returns single listing', async ({ request }) => {
    // First fetch an existing ID
    const listRes = await request.get(`${API_URL}/api/listings?limit=1`)
    const list = await listRes.json()
    if (!list.data?.[0]) test.skip(true, 'no listings to test')
    const id = list.data[0].id

    const res = await request.get(`${API_URL}/api/listings/${id}`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.data.id).toBe(id)
  })

  test('GET /api/listings/{nonexistent} returns 404', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/listings/999999999`)
    expect(res.status()).toBe(404)
  })

  test('POST /api/auth/login with empty body returns 422', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(422)
    const json = await res.json()
    expect(json).toHaveProperty('errors')
    expect(json.errors).toHaveProperty('email')
    expect(json.errors).toHaveProperty('password')
  })

  test('POST /api/auth/login with wrong credentials returns 401 + Arabic message', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'nobody@nowhere.test', password: 'wrong-password-1234' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(401)
    const json = await res.json()
    expect(json.message).toContain('البريد')  // Arabic error message
  })

  test('GET /api/admin/dashboard without auth is gated', async ({ request }) => {
    // Forcing JSON via Accept header makes Laravel return the proper
    // Unauthenticated message (otherwise apache serves the generic 500 page).
    const res = await request.get(`${API_URL}/api/admin/dashboard`, {
      headers: { 'Accept': 'application/json' },
    })
    const json = await res.json()
    expect(json.message).toMatch(/Unauthenticated|غير مصرح|forbidden/i)
  })

  test('CORS allows www.nwafizlogi.com origin', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'a@b.c', password: 'x' },
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://www.nwafizlogi.com',
      },
    })
    const allowOrigin = res.headers()['access-control-allow-origin']
    expect(allowOrigin).toBe('https://www.nwafizlogi.com')
  })

  test('GET /api/listings/{id}/comments returns array', async ({ request }) => {
    const listRes = await request.get(`${API_URL}/api/listings?limit=1`)
    const list = await listRes.json()
    if (!list.data?.[0]) test.skip(true, 'no listings')
    const id = list.data[0].id

    const res = await request.get(`${API_URL}/api/listings/${id}/comments`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('data')
    expect(Array.isArray(json.data)).toBe(true)
    // Q&A fields should be present even on legacy comments (after migration)
    if (json.data.length > 0) {
      const c = json.data[0]
      expect(c).toHaveProperty('upvotes_count')
      expect(c).toHaveProperty('is_official_answer')
      expect(c).toHaveProperty('is_marked_helpful')
    }
  })

  test('GET /api/listings/{id}/bids returns summary', async ({ request }) => {
    const listRes = await request.get(`${API_URL}/api/listings?section=ma&limit=1`)
    const list = await listRes.json()
    if (!list.data?.[0]) test.skip(true, 'no M&A listings')
    const id = list.data[0].id

    const res = await request.get(`${API_URL}/api/listings/${id}/bids`)
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('bid_count')
    expect(json).toHaveProperty('highest_bid')
    expect(json).toHaveProperty('bids')
  })
})
