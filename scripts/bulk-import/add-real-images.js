#!/usr/bin/env node
/**
 * Replace AI-generated (or missing) listing images with REAL stock photos
 * from Pexels — high-quality, commercial-licensed, no attribution needed.
 *
 *   - Logs in as the launch-data owner (opportunities@nwafizlogi.com).
 *   - Builds a smart English search query from each listing's title + section.
 *   - Searches Pexels (curated, high-quality first), downloads top match.
 *   - Replaces any existing images (so AI placeholders get wiped) by sending
 *     remove_images alongside the new image upload in a single PATCH.
 *
 * Usage:
 *   PEXELS_API_KEY=<your_key> node scripts/bulk-import/add-real-images.js
 *   PEXELS_API_KEY=<your_key> node scripts/bulk-import/add-real-images.js --dry-run
 *   PEXELS_API_KEY=<your_key> node scripts/bulk-import/add-real-images.js --num 2
 *   PEXELS_API_KEY=<your_key> node scripts/bulk-import/add-real-images.js --skip-with-images
 *     (only process listings that currently have zero images)
 *
 * Get your free key: https://www.pexels.com/api/  (20,000 req/month free)
 */

const fs   = require('node:fs')
const path = require('node:path')

// ─── Config ────────────────────────────────────────────────────────────────
const API_URL      = process.env.NWAFIZ_API_URL          ?? 'https://nwafiz.creativealphat.com'
const OWNER_EMAIL  = process.env.NWAFIZ_OWNER_EMAIL      ?? 'opportunities@nwafizlogi.com'
const OWNER_PASS   = process.env.NWAFIZ_OWNER_PASSWORD   ?? 'Nwafiz2026!'
const PEXELS_KEY   = process.env.PEXELS_API_KEY

if (!PEXELS_KEY) {
  console.error('\n❌ PEXELS_API_KEY environment variable is required.')
  console.error('   Get a free key at https://www.pexels.com/api/ then re-run:')
  console.error('   PEXELS_API_KEY=<your_key> node scripts/bulk-import/add-real-images.js\n')
  process.exit(1)
}

const IMG_DIR          = path.join(__dirname, 'output-real')
const DRY_RUN          = process.argv.includes('--dry-run')
const SKIP_WITH_IMAGES = process.argv.includes('--skip-with-images')
const NUM_IMG          = (() => {
  const idx = process.argv.indexOf('--num')
  return idx >= 0 ? Math.max(1, parseInt(process.argv[idx + 1] || '1')) : 1
})()
const DELAY_MS = 1500   // pacing between listings

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

// ─── Smart Pexels keyword builder ──────────────────────────────────────────
function buildKeywords(listing) {
  const t   = ((listing.title_ar || '') + ' ' + (listing.description_ar || '')).toLowerCase()
  const sec = listing.section

  // ─ Specific vehicles (highest signal first)
  if (/شاحن|تريل|لوبد/.test(t))                       return 'mercedes truck logistics'
  if (/مبرد|إيسوزو|هايس مبرد/.test(t))                 return 'refrigerated truck delivery van'
  if (/دباب|دراج|بوكسر|bajaj|tvs/.test(t))            return 'delivery scooter motorcycle saudi'
  if (/باص|حافل/.test(t))                              return 'modern minibus white'
  if (/سطح/.test(t))                                   return 'flatbed truck cargo'
  if (/تاكسي|أجرة/.test(t))                            return 'taxi car city street'
  if (/كيا|نيسان|شيري|سوزوكي|ديزاير|بيجاس|اريزو|سمبول|سبارك|شفروليه|شانجان|هيونداي/.test(t)) {
    return 'new sedan car showroom dealer'
  }
  if (/سيارة/.test(t))                                 return 'modern sedan car'

  // ─ M&A — business entities
  if (sec === 'ma' || /مؤسسة|كيان|شركة|سجل تجاري/.test(t)) {
    if (/لوجست/.test(t))                              return 'logistics company warehouse'
    if (/دباب|دراج/.test(t))                         return 'delivery scooter fleet parking'
    return 'modern office building business'
  }

  // ─ Property / staff
  if (/مكتب|سكن|مقر|استراحة/.test(t))                  return 'modern office workspace'
  if (/مندوب|توصيل/.test(t))                          return 'delivery rider motorcycle city'

  // ─ Services (forum)
  if (sec === 'forum') {
    if (/قانون|تراخيص|محامي/.test(t))                 return 'legal documents pen contract office'
    if (/تمويل|محاسب|ضريب|زكاة/.test(t))              return 'business finance calculator documents'
    if (/معقب|تعقيب/.test(t))                         return 'office paperwork documents files'
    if (/تأمين/.test(t))                              return 'insurance documents handshake'
    if (/سعودة|استقدام|توظيف/.test(t))                return 'office recruitment workplace meeting'
    if (/استشار/.test(t))                             return 'business consulting meeting'
    return 'professional business office'
  }

  // ─ Jobs section
  if (sec === 'jobs') {
    if (/مندوب|مناديب/.test(t))                       return 'delivery driver motorcycle'
    if (/سائق/.test(t))                               return 'truck driver portrait'
    if (/محاسب|مالي/.test(t))                         return 'accountant office laptop'
    return 'professional worker uniform'
  }

  // ─ Contracts — operational
  if (sec === 'contracts') {
    if (/نقل/.test(t))                                return 'logistics truck delivery road'
    if (/تتبع|GPS|أجهزة/.test(t))                    return 'fleet tracking technology dashboard'
    return 'business contract handshake meeting'
  }

  // ─ Fallback per section
  const fallback = {
    fleet:     'logistics truck fleet',
    contracts: 'business contract meeting',
    ma:        'modern office building',
    jobs:      'workplace professional',
    forum:     'business documents office',
  }
  return fallback[sec] ?? 'logistics business'
}

// ─── Pexels search ─────────────────────────────────────────────────────────
async function searchPexels(query, page = 1, perPage = 5) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
              `&per_page=${perPage}&page=${page}&orientation=landscape&size=medium`
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } })
  if (!res.ok) throw new Error(`Pexels search HTTP ${res.status}`)
  const json = await res.json()
  return json.photos ?? []
}

// Download a single Pexels photo URL to a local file.
async function downloadPhoto(photoUrl, listingId, idx) {
  const fileName = `listing-${listingId}-${idx}-real.jpg`
  const filePath = path.join(IMG_DIR, fileName)

  if (fs.existsSync(filePath)) {
    log.dim(`  [cache] ${fileName}`)
    return filePath
  }

  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 30_000)
  const res = await fetch(photoUrl, { signal: ctrl.signal })
  clearTimeout(timer)
  if (!res.ok) throw new Error(`download HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 8000) throw new Error('image too small')
  fs.writeFileSync(filePath, buf)
  log.dim(`  [saved] ${fileName} (${Math.round(buf.length / 1024)}KB)`)
  return filePath
}

// ─── Upload to listing (replaces existing media in one PATCH) ──────────────
async function uploadImages(listing, imagePaths, token, removeExisting) {
  const form = new FormData()
  form.append('section',  listing.section)
  form.append('title_ar', listing.title_ar)

  if (removeExisting && Array.isArray(listing.media) && listing.media.length > 0) {
    // remove_images is a JSON-encoded array of paths
    const toRemove = listing.media.map((m) => m.path).filter(Boolean)
    form.append('remove_images', JSON.stringify(toRemove))
  }

  for (const p of imagePaths) {
    const buf  = fs.readFileSync(p)
    const blob = new Blob([buf], { type: 'image/jpeg' })
    form.append('images[]', blob, path.basename(p))
  }

  const res = await apiPostForm(`/api/listings/${listing.id}`, form, token)
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`upload failed (${res.status}): ${JSON.stringify(res.json).slice(0, 200)}`)
  }
  return res.json
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(IMG_DIR, { recursive: true })

  log.step(`Replace Images with REAL Pexels Photos — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  log.info(`API:        ${API_URL}`)
  log.info(`Owner:      ${OWNER_EMAIL}`)
  log.info(`Per ad:     ${NUM_IMG} image${NUM_IMG > 1 ? 's' : ''}`)
  log.info(`Mode:       ${SKIP_WITH_IMAGES ? 'append only (skip listings that already have images)' : 'REPLACE all existing images'}`)

  const token = await login()

  log.step('Fetching listings...')
  const listings = await fetchAllListings(token)
  log.info(`${listings.length} total listings under owner`)

  const targets = SKIP_WITH_IMAGES
    ? listings.filter((l) => !Array.isArray(l.media) || l.media.length === 0)
    : listings
  log.info(`${targets.length} will be processed`)
  if (targets.length === 0) {
    log.ok('Nothing to do.')
    return
  }

  const summary = { ok: 0, fail: 0, skipped: 0 }
  const failed  = []

  for (let i = 0; i < targets.length; i++) {
    const listing = targets[i]
    const keywords = buildKeywords(listing)
    log.step(`[${i + 1}/${targets.length}]  id=${listing.id}  ${listing.section}/${listing.listing_type}  —  ${(listing.title_ar || '').slice(0, 60)}`)
    log.dim(`  search: "${keywords}"`)

    if (DRY_RUN) {
      summary.skipped++
      continue
    }

    try {
      const photos = await searchPexels(keywords, 1, Math.max(NUM_IMG + 2, 5))
      if (photos.length === 0) {
        throw new Error(`no Pexels results for "${keywords}"`)
      }
      log.dim(`  found ${photos.length} photos`)

      // Pick top N most distinct (skip identical photographer to avoid same shoot)
      const picked = []
      const seenPhotographers = new Set()
      for (const ph of photos) {
        if (picked.length >= NUM_IMG) break
        if (seenPhotographers.has(ph.photographer_id)) continue
        seenPhotographers.add(ph.photographer_id)
        picked.push(ph)
      }
      if (picked.length === 0) picked.push(photos[0])

      const downloaded = []
      for (let idx = 0; idx < picked.length; idx++) {
        // Use 'large' size — ~1880x1253 JPEG, ~150-300KB, perfect for listings
        const src = picked[idx].src?.large ?? picked[idx].src?.medium ?? picked[idx].src?.original
        if (!src) continue
        const file = await downloadPhoto(src, listing.id, idx)
        downloaded.push(file)
      }

      if (downloaded.length === 0) throw new Error('no images downloaded')

      await uploadImages(listing, downloaded, token, /* removeExisting */ !SKIP_WITH_IMAGES)
      log.ok(`  uploaded ${downloaded.length} real image${downloaded.length > 1 ? 's' : ''}`)
      summary.ok++
    } catch (e) {
      log.fail(`  failed: ${e.message}`)
      summary.fail++
      failed.push({ id: listing.id, title: listing.title_ar, error: e.message })
    }

    if (i < targets.length - 1) await sleep(DELAY_MS)
  }

  log.step('Summary')
  log.ok(`${summary.ok} listings now have real photos`)
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
