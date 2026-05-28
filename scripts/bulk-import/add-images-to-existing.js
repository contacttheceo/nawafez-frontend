#!/usr/bin/env node
/**
 * Add AI-generated images to existing listings (post-launch backfill).
 *
 *   - Logs in as the launch-data owner (opportunities@nwafizlogi.com).
 *   - Iterates every listing for that user.
 *   - For each listing that has zero images, generates one with
 *     Pollinations.ai (free, no API key) using a smart prompt built
 *     from title + section.
 *   - POSTs the image to /api/listings/{id} (the update endpoint
 *     appends images[] to the existing media array).
 *   - Caches generated images under scripts/bulk-import/output/ so re-runs
 *     don't re-download.
 *
 * Run:
 *   node scripts/bulk-import/add-images-to-existing.js
 *   node scripts/bulk-import/add-images-to-existing.js --dry-run
 *   node scripts/bulk-import/add-images-to-existing.js --force   (regenerate even if has images)
 *   node scripts/bulk-import/add-images-to-existing.js --num 2   (2 images per listing instead of 1)
 *
 * Required env (override with NWAFIZ_OWNER_EMAIL / NWAFIZ_OWNER_PASSWORD):
 *   email: opportunities@nwafizlogi.com
 *   pass:  Nwafiz2026!
 */

const fs   = require('node:fs')
const path = require('node:path')

// ─── Config ────────────────────────────────────────────────────────────────
const API_URL    = process.env.NWAFIZ_API_URL  ?? 'https://nwafiz.creativealphat.com'
const OWNER_EMAIL = process.env.NWAFIZ_OWNER_EMAIL    ?? 'opportunities@nwafizlogi.com'
const OWNER_PASS  = process.env.NWAFIZ_OWNER_PASSWORD ?? 'Nwafiz2026!'

const IMG_DIR  = path.join(__dirname, 'output')
const DRY_RUN  = process.argv.includes('--dry-run')
const FORCE    = process.argv.includes('--force')
const NUM_IMG  = (() => {
  const idx = process.argv.indexOf('--num')
  return idx >= 0 ? Math.max(1, parseInt(process.argv[idx + 1] || '1')) : 1
})()
const DELAY_MS = 2500   // gap between Pollinations requests to be polite

// ─── Colored logger ────────────────────────────────────────────────────────
const c = (n, s) => `\x1b[${n}m${s}\x1b[0m`
const log = {
  step: (s) => console.log(c('1;34', '▶') + ' ' + c('1', s)),
  ok:   (s) => console.log(c('32', '✓') + ' ' + s),
  fail: (s) => console.log(c('31', '✗') + ' ' + s),
  info: (s) => console.log(c('36', '→') + ' ' + s),
  dim:  (s) => console.log(c('90', '   ' + s)),
  warn: (s) => console.log(c('33', '⚠') + ' ' + s),
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── HTTP helpers ──────────────────────────────────────────────────────────
async function apiPost(p, body, headers = {}) {
  const res = await fetch(API_URL + p, {
    method:  'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...headers },
    body:    JSON.stringify(body),
  })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}

async function apiGet(p, token) {
  const res = await fetch(API_URL + p, {
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
  })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}

async function apiPostForm(p, formData, token) {
  const res = await fetch(API_URL + p, {
    method:  'POST',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body:    formData,
  })
  return { status: res.status, json: await res.json().catch(() => ({})) }
}

// ─── Login ─────────────────────────────────────────────────────────────────
async function login() {
  log.step(`Logging in as ${OWNER_EMAIL}`)
  const res = await apiPost('/api/auth/login', { email: OWNER_EMAIL, password: OWNER_PASS })
  if (res.status !== 200 || !res.json.token) {
    throw new Error(`Login failed: ${JSON.stringify(res.json)}`)
  }
  log.ok(`logged in (user_id=${res.json.user?.id})`)
  return res.json.token
}

// ─── Fetch all listings (paginated) ────────────────────────────────────────
async function fetchAllListings(token) {
  let all = []
  let page = 1
  while (true) {
    const res = await apiGet(`/api/user/listings?page=${page}`, token)
    if (res.status !== 200) throw new Error(`getListings page ${page}: ${res.status}`)
    const data = res.json.data ?? []
    all = all.concat(data)
    const last = res.json.last_page ?? 1
    log.dim(`  page ${page}/${last} (+${data.length})`)
    if (page >= last) break
    page++
  }
  return all
}

// ─── Smart prompt builder ──────────────────────────────────────────────────
const SECTION_HINTS = {
  fleet:     'Saudi Arabia logistics fleet yard, daytime, professional product shot, high quality, photorealistic',
  contracts: 'Saudi logistics business meeting, professional corporate setting, no faces visible, clean lighting',
  ma:        'Saudi business handshake metaphor, modern office, financial documents, professional photo',
  jobs:      'Saudi delivery worker outfit and equipment, professional workspace, no identifying faces',
  forum:     'Saudi business consultation, office desk with documents, neutral professional setting',
}

// Try to detect specific vehicle/object from the Arabic title so the image
// makes sense (e.g. شاحنة → truck, دباب → motorcycle, مبرد → refrigerated van).
function detectObject(titleAr = '', descAr = '', section = '') {
  const t = (titleAr + ' ' + descAr).toLowerCase()
  // Specific vehicles first (most-specific → least)
  if (/شاحن|تريل|لوبد/i.test(t))                   return 'large Mercedes Actros truck'
  if (/مبرد|إيسوزو|isuzu|هايس مبرد/i.test(t))      return 'white refrigerated truck'
  if (/دباب|دراج|bajaj|بوكسر|toiba|tvs/i.test(t))  return 'Bajaj Boxer delivery motorcycle'
  if (/باص|حافل|bus/i.test(t))                     return 'modern white minibus'
  if (/سطح/i.test(t))                              return 'flatbed transport truck loaded with cargo'
  if (/تاكسي|أجرة/i.test(t))                       return 'yellow taxi cab on Saudi street'
  if (/كيا|نيسان|شيري|سوزوكي|ديزاير|بيجاس|اريزو|سمبول|سبارك|شفروليه|شانجان|هيونداي/i.test(t)) {
    return 'modern Korean sedan car at showroom'
  }
  if (/سيارة/i.test(t))                            return 'modern white sedan car'

  // M&A business entities — never use vehicle imagery
  if (section === 'ma' || /مؤسسة|كيان|شركة|سجل تجاري/i.test(t)) {
    if (/لوجست/i.test(t))                          return 'modern Saudi logistics business building with trucks parked outside'
    if (/دباب|دراج/i.test(t))                      return 'delivery motorcycle fleet parked in Saudi business lot'
    return 'modern Saudi office building exterior, glass facade, daytime'
  }

  // Property / staff
  if (/مكتب|سكن|مقر|استراحة/i.test(t))             return 'modern Saudi office building exterior'
  if (/مندوب|توصيل/i.test(t))                      return 'delivery rider on motorcycle in Saudi Arabian city street'

  // Services — render as professional service scenes
  if (section === 'forum') {
    if (/قانون|تراخيص|محامي/i.test(t))             return 'Saudi legal documents on desk with pen, professional setting'
    if (/تمويل|محاسب|ضريب|زكاة/i.test(t))          return 'Saudi business financial documents with calculator and laptop'
    if (/معقب|تعقيب/i.test(t))                     return 'Saudi government services office, organized documents, professional'
    if (/تأمين/i.test(t))                          return 'Saudi insurance paperwork with handshake metaphor'
    if (/سعودة|استقدام|توظيف/i.test(t))            return 'modern Saudi office workspace, recruitment documents'
  }
  return null
}

function buildPrompt(listing) {
  const obj      = detectObject(listing.title_ar, listing.description_ar, listing.section)
  const sec      = listing.section
  const hint     = SECTION_HINTS[sec] ?? SECTION_HINTS.fleet
  if (obj) return `Professional photo of ${obj}, ${hint}`
  // generic fallback
  const titleEn = (listing.title_en || '').slice(0, 80)
  return titleEn
    ? `${titleEn}, ${hint}`
    : `Saudi Arabia logistics business scene, ${hint}`
}

// ─── Pollinations image fetch ──────────────────────────────────────────────
async function generateImage(prompt, listingId, idx) {
  const seed     = (listingId * 100 + idx) % 1_000_000
  const fileName = `listing-${listingId}-${idx}.jpg`
  const filePath = path.join(IMG_DIR, fileName)

  if (!FORCE && fs.existsSync(filePath)) {
    log.dim(`  [cache] ${fileName}`)
    return filePath
  }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
              `?width=1200&height=800&model=flux&nologo=true&seed=${seed}&enhance=true`

  log.dim(`  [gen] ${prompt.slice(0, 70)}...`)
  // Pollinations can be slow; retry once on timeout/non-200
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 75_000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 5000) throw new Error('image too small, probably error')
      fs.writeFileSync(filePath, buf)
      const kb = Math.round(buf.length / 1024)
      log.dim(`  [saved] ${fileName} (${kb}KB)`)
      return filePath
    } catch (e) {
      if (attempt === 2) throw e
      log.warn(`  attempt ${attempt} failed: ${e.message}, retrying in 5s...`)
      await sleep(5000)
    }
  }
}

// ─── Upload image to listing via update endpoint ───────────────────────────
async function uploadImage(listing, imagePath, token) {
  const form = new FormData()
  // Update endpoint requires section + title_ar to re-validate;
  // we pass them unchanged.
  form.append('section',  listing.section)
  form.append('title_ar', listing.title_ar)
  const buf  = fs.readFileSync(imagePath)
  const blob = new Blob([buf], { type: 'image/jpeg' })
  form.append('images[]', blob, path.basename(imagePath))

  const res = await apiPostForm(`/api/listings/${listing.id}`, form, token)
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`upload failed (${res.status}): ${JSON.stringify(res.json).slice(0, 200)}`)
  }
  return res.json
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(IMG_DIR, { recursive: true })

  log.step(`Add Images to Existing Listings — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  log.info(`API:     ${API_URL}`)
  log.info(`Owner:   ${OWNER_EMAIL}`)
  log.info(`Force:   ${FORCE ? 'yes (regenerate all)' : 'no (skip listings that already have images)'}`)
  log.info(`Per ad:  ${NUM_IMG} image${NUM_IMG > 1 ? 's' : ''}`)

  const token = await login()

  log.step('Fetching listings...')
  const listings = await fetchAllListings(token)
  log.info(`${listings.length} total listings under owner`)

  const targets = FORCE
    ? listings
    : listings.filter((l) => !Array.isArray(l.media) || l.media.length === 0)
  log.info(`${targets.length} need images${FORCE ? ' (forced)' : ''}`)

  if (targets.length === 0) {
    log.ok('Nothing to do — all listings already have images. Use --force to regenerate.')
    return
  }

  const summary = { ok: 0, fail: 0, skipped: 0 }
  const failed  = []

  for (let i = 0; i < targets.length; i++) {
    const listing = targets[i]
    log.step(`[${i + 1}/${targets.length}]  id=${listing.id}  ${listing.section}/${listing.listing_type}  —  ${(listing.title_ar || '').slice(0, 60)}`)

    if (DRY_RUN) {
      const prompt = buildPrompt(listing)
      log.dim(`  [DRY] would generate: ${prompt.slice(0, 80)}`)
      summary.skipped++
      continue
    }

    try {
      for (let idx = 0; idx < NUM_IMG; idx++) {
        const prompt = buildPrompt(listing)
        const imgPath = await generateImage(prompt, listing.id, idx)
        await uploadImage(listing, imgPath, token)
        log.ok(`  uploaded image ${idx + 1}/${NUM_IMG}`)
        // small gap between images for the same listing
        if (idx < NUM_IMG - 1) await sleep(800)
      }
      summary.ok++
    } catch (e) {
      log.fail(`  failed: ${e.message}`)
      summary.fail++
      failed.push({ id: listing.id, title: listing.title_ar, error: e.message })
    }

    // pacing between listings — Pollinations limits ~5 concurrent requests
    if (i < targets.length - 1) await sleep(DELAY_MS)
  }

  log.step('Summary')
  log.ok(`${summary.ok} listings now have images`)
  if (summary.fail > 0) log.fail(`${summary.fail} failed`)
  if (summary.skipped > 0) log.info(`${summary.skipped} dry-run only`)
  if (failed.length > 0) {
    console.log('')
    log.warn('Failed listings:')
    failed.forEach((f) => log.dim(`  id=${f.id} — ${f.title?.slice(0, 60)} — ${f.error}`))
  }
}

main().catch((e) => {
  console.error('\n💥 fatal:', e.message)
  process.exit(1)
})
