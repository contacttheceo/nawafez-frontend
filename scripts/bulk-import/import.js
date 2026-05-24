#!/usr/bin/env node
/**
 * Bulk import listings to Nawafez.
 *
 * Reads a CSV of listings + user assignments, then:
 *   1. Creates new user accounts (if needed) via /api/auth/register
 *   2. Generates AI images via Pollinations.ai (free, Flux model)
 *   3. Creates listings via /api/listings on behalf of each user
 *
 * Usage:
 *   node scripts/bulk-import/import.js path/to/listings.csv [--dry-run]
 *
 * Environment:
 *   API_URL   defaults to https://nwafiz.creativealphat.com
 *   IMG_DIR   defaults to scripts/bulk-import/output (downloaded images cached here)
 *
 * CSV columns (see templates/listings-template.csv):
 *   user_email, user_name_ar, user_name_en, user_phone, user_password, user_role,
 *   section, listing_type, forum_category,
 *   title_ar, title_en, description_ar, description_en,
 *   city, region, price, price_type, contact_phone,
 *   dynamic_data_json, image_prompt, num_images
 */

const fs   = require('node:fs')
const path = require('node:path')
const { setTimeout: sleep } = require('node:timers/promises')

const API_URL  = process.env.API_URL  || 'https://nwafiz.creativealphat.com'
const IMG_DIR  = process.env.IMG_DIR  || path.join(__dirname, 'output')
const DRY_RUN  = process.argv.includes('--dry-run')

// ─── Colors ──────────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  red:   '\x1b[31m', green: '\x1b[32m',
  yellow:'\x1b[33m', blue:  '\x1b[34m',
  cyan:  '\x1b[36m', gray:  '\x1b[90m',
}
const log = {
  ok:   (...a) => console.log(c.green + '✓' + c.reset, ...a),
  fail: (...a) => console.log(c.red   + '✗' + c.reset, ...a),
  warn: (...a) => console.log(c.yellow + '!' + c.reset, ...a),
  info: (...a) => console.log(c.cyan  + '→' + c.reset, ...a),
  step: (...a) => console.log('\n' + c.bold + c.blue + '▶' + c.reset, c.bold + a.join(' ') + c.reset),
  dim:  (...a) => console.log(c.gray + '  ' + a.join(' ') + c.reset),
}

// ─── CSV Parser (handles quoted fields with commas/newlines) ──────────────────
function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQuotes = false, i = 0
  const push = () => { row.push(field); field = '' }
  const newline = () => { push(); rows.push(row); row = [] }
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i+1] === '"') { field += '"'; i += 2; continue }
      if (ch === '"') { inQuotes = false; i++; continue }
      field += ch; i++; continue
    }
    if (ch === '"') { inQuotes = true; i++; continue }
    if (ch === ',') { push(); i++; continue }
    if (ch === '\n')          { newline(); i++; continue }
    if (ch === '\r' && text[i+1] === '\n') { newline(); i += 2; continue }
    if (ch === '\r')          { newline(); i++; continue }
    field += ch; i++
  }
  if (field || row.length > 0) newline()

  // First row is header
  const [headers, ...data] = rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''))
  return data.map(r => Object.fromEntries(headers.map((h, idx) => [h.trim(), (r[idx] ?? '').trim()])))
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────
async function apiPost(path, body, headers = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json; try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { status: res.status, json }
}

async function apiPostForm(path, formData, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method:  'POST',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body:    formData,
  })
  const text = await res.text()
  let json; try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { status: res.status, json }
}

// ─── User: login or register ─────────────────────────────────────────────────
const userTokens = new Map()  // email → token cache

async function getOrCreateUser(row) {
  const { user_email, user_name_ar, user_name_en, user_phone, user_password, user_role } = row
  if (!user_email) throw new Error('user_email is required')

  if (userTokens.has(user_email)) return userTokens.get(user_email)

  // DRY RUN: don't touch the DB. Just validate that we COULD.
  if (DRY_RUN) {
    if (!user_password) throw new Error(`user_password missing for ${user_email}`)
    log.dim(`   [DRY]       ${user_email}  (would login or register)`)
    userTokens.set(user_email, 'DRY_RUN_TOKEN')
    return 'DRY_RUN_TOKEN'
  }

  // Try login first
  const login = await apiPost('/api/auth/login', {
    email:    user_email,
    password: user_password,
  })
  if (login.status === 200 && login.json.token) {
    log.dim(`   [login OK]  ${user_email}`)
    userTokens.set(user_email, login.json.token)
    return login.json.token
  }

  // Otherwise register
  if (!user_name_ar || !user_name_en || !user_password) {
    throw new Error(`Cannot register ${user_email} — name_ar / name_en / password required`)
  }
  const reg = await apiPost('/api/auth/register', {
    name_ar:               user_name_ar,
    name_en:               user_name_en,
    email:                 user_email,
    password:              user_password,
    password_confirmation: user_password,
    phone:                 user_phone || undefined,
  })
  if (reg.status !== 201 || !reg.json.token) {
    throw new Error(`Register failed for ${user_email}: ${JSON.stringify(reg.json)}`)
  }
  log.dim(`   [register]  ${user_email}  ${user_role === 'business' ? '(business)' : ''}`)
  userTokens.set(user_email, reg.json.token)
  return reg.json.token
}

// ─── AI image generation via Pollinations.ai ──────────────────────────────────
// Free, no API key, uses Flux model. Endpoint:
// https://image.pollinations.ai/prompt/{encoded prompt}?width=1200&height=800&model=flux&nologo=true&seed={n}
async function generateImage(prompt, seedBase, index = 0) {
  const encoded = encodeURIComponent(prompt)
  const seed    = (seedBase * 1000) + index
  const url     = `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=800&model=flux&nologo=true&seed=${seed}`

  const filename = `gen-${seedBase}-${index}.jpg`
  const filepath = path.join(IMG_DIR, filename)
  if (fs.existsSync(filepath)) {
    log.dim(`   [cached]    ${filename}`)
    return filepath
  }

  // Pollinations can take 5-30s per image; retry once on failure
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(filepath, buf)
      log.dim(`   [image]     ${filename}  (${Math.round(buf.length / 1024)}KB)`)
      return filepath
    } catch (e) {
      if (attempt === 2) throw e
      log.warn(`   image attempt ${attempt} failed: ${e.message}, retrying...`)
      await sleep(2000)
    }
  }
}

// ─── Build image prompt from listing data ────────────────────────────────────
function defaultPromptFor(row) {
  const sectionDescriptor = {
    fleet:     'Saudi logistics vehicle',
    contracts: 'professional logistics business in Saudi Arabia',
    ma:        'Saudi business acquisition scene',
    jobs:      'Saudi logistics workplace',
    forum:     '',
  }[row.section] || ''
  const title = row.title_en || row.title_ar
  return `Professional product photo: ${title}, ${sectionDescriptor}, high quality, natural lighting, realistic`
}

// ─── Create listing ──────────────────────────────────────────────────────────
async function createListing(row, token, rowIndex) {
  const numImages = parseInt(row.num_images || '0', 10)
  const imagePaths = []

  if (numImages > 0 && !DRY_RUN) {
    const prompt = row.image_prompt?.trim() || defaultPromptFor(row)
    for (let i = 0; i < numImages; i++) {
      try {
        const p = await generateImage(prompt, rowIndex, i)
        if (p) imagePaths.push(p)
      } catch (e) {
        log.warn(`   image #${i+1} failed: ${e.message}`)
      }
    }
  }

  if (DRY_RUN) {
    log.dim(`   [DRY] would create listing in section=${row.section}, ${numImages} images`)
    return { dryRun: true }
  }

  const form = new FormData()
  form.append('section',        row.section)
  if (row.listing_type)   form.append('listing_type',   row.listing_type)
  if (row.forum_category) form.append('forum_category', row.forum_category)
  form.append('title_ar',       row.title_ar)
  if (row.title_en)       form.append('title_en',       row.title_en)
  form.append('description_ar', row.description_ar)
  if (row.description_en) form.append('description_en', row.description_en)
  if (row.city)           form.append('city',           row.city)
  if (row.region)         form.append('region',         row.region)
  if (row.price)          form.append('price',          row.price)
  if (row.price_type)     form.append('price_type',     row.price_type)
  if (row.contact_phone)  form.append('contact_phone',  row.contact_phone)
  if (row.dynamic_data_json) form.append('dynamic_data', row.dynamic_data_json)

  for (const imgPath of imagePaths) {
    const buf      = fs.readFileSync(imgPath)
    const blob     = new Blob([buf], { type: 'image/jpeg' })
    form.append('images[]', blob, path.basename(imgPath))
  }

  const res = await apiPostForm('/api/listings', form, token)
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`POST /api/listings failed (${res.status}): ${JSON.stringify(res.json).slice(0, 200)}`)
  }
  return res.json
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    log.fail('Usage: node import.js <path/to/listings.csv> [--dry-run]')
    process.exit(1)
  }
  if (!fs.existsSync(csvPath)) {
    log.fail(`File not found: ${csvPath}`)
    process.exit(1)
  }
  fs.mkdirSync(IMG_DIR, { recursive: true })

  log.step(`Bulk Import — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  log.info(`API:   ${API_URL}`)
  log.info(`CSV:   ${csvPath}`)
  log.info(`Cache: ${IMG_DIR}`)

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  log.info(`Rows:  ${rows.length}`)

  const summary = { ok: 0, fail: 0, users: new Set() }
  const errors  = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    log.step(`[${i+1}/${rows.length}]  ${row.section}/${row.listing_type}  —  ${row.title_ar.slice(0, 60)}`)

    try {
      const token = await getOrCreateUser(row)
      summary.users.add(row.user_email)

      const result = await createListing(row, token, i + 1)
      if (result.dryRun) {
        log.ok(`dry-run`)
      } else {
        log.ok(`listing created — id=${result.data?.id}, status=${result.data?.status}`)
      }
      summary.ok++
    } catch (e) {
      log.fail(`${e.message}`)
      summary.fail++
      errors.push({ row: i + 1, title: row.title_ar.slice(0, 60), error: e.message })
    }

    // Small delay to be gentle on the API
    if (!DRY_RUN) await sleep(500)
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log()
  log.step('Summary')
  log.ok  (`${summary.ok} listings created`)
  if (summary.fail > 0) log.fail(`${summary.fail} failed`)
  log.info(`${summary.users.size} unique users involved`)

  if (errors.length > 0) {
    console.log(c.red + '\nFailed rows:' + c.reset)
    for (const e of errors) {
      console.log(`  Row ${e.row}: ${c.yellow}${e.title}${c.reset}`)
      console.log(`    ${c.gray}${e.error}${c.reset}`)
    }
  }
  process.exit(summary.fail > 0 ? 1 : 0)
}

main().catch(e => {
  log.fail('Fatal: ' + e.message)
  console.error(e.stack)
  process.exit(1)
})
