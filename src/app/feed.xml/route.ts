import { NextResponse } from 'next/server'

/**
 * Atom 1.0 feed of the latest 50 active listings.
 *
 * Used by:
 *  - News aggregators (Inoreader, Feedly, etc.)
 *  - Telegram channels via @ChannelFeedBot or RSS-to-Telegram services
 *  - X auto-poster services (IFTTT, Zapier)
 *  - Anyone who wants programmatic notifications without auth
 *
 * Cached for 30 minutes at the CDN edge.
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'
const API  = process.env.NEXT_PUBLIC_API_URL ?? 'https://nwafiz.creativealphat.com'

interface BackendListing {
  id:             number
  title_ar:       string | null
  title_en:       string | null
  description_ar: string | null
  description_en: string | null
  city:           string | null
  price:          number | null
  currency:       string | null
  section:        string
  created_at:     string
  updated_at:     string
  media?:         Array<{ path: string; type: string; is_primary?: boolean }>
}

function xml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function fetchLatest(): Promise<BackendListing[]> {
  try {
    const res = await fetch(`${API}/api/listings?limit=50&sort=newest`, {
      next: { revalidate: 1800 },
    })
    if (!res.ok) return []
    const json: { data?: BackendListing[] } = await res.json()
    return json.data ?? []
  } catch { return [] }
}

export const revalidate = 1800

export async function GET() {
  const items = await fetchLatest()
  const now = new Date().toISOString()

  const sectionLabels: Record<string, string> = {
    fleet: 'أسطول', contracts: 'عقود', ma: 'استحواذ',
    jobs: 'توظيف', forum: 'منتدى',
  }

  const entries = items.map(l => {
    const title  = l.title_ar ?? l.title_en ?? `Listing #${l.id}`
    const desc   = (l.description_ar ?? l.description_en ?? '').slice(0, 400)
    const url    = `${BASE}/ar/listings/${l.id}`
    const cat    = sectionLabels[l.section] ?? l.section
    const cityP  = l.city ? ` · 📍 ${l.city}` : ''
    const priceP = l.price ? ` · 💰 ${Number(l.price).toLocaleString('ar-SA')} ر.س` : ''
    const summary = xml(`[${cat}]${cityP}${priceP}\n\n${desc}`)

    return `  <entry>
    <id>${xml(url)}</id>
    <title>${xml(title)}</title>
    <link href="${xml(url)}" />
    <updated>${new Date(l.updated_at || l.created_at).toISOString()}</updated>
    <published>${new Date(l.created_at).toISOString()}</published>
    <category term="${xml(l.section)}" label="${xml(cat)}" />
    <summary type="text">${summary}</summary>
  </entry>`
  }).join('\n')

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ar">
  <id>${BASE}/</id>
  <title>نوافذ — أحدث الإعلانات اللوجستية</title>
  <subtitle>أحدث 50 إعلان نشط في منصة نوافذ B2B للوجستيك في السعودية</subtitle>
  <link href="${BASE}/" />
  <link rel="self" href="${BASE}/feed.xml" type="application/atom+xml" />
  <updated>${now}</updated>
  <author><name>Nwafiz</name><uri>${BASE}</uri></author>
  <icon>${BASE}/logo.png</icon>
${entries}
</feed>`

  return new NextResponse(feed, {
    status: 200,
    headers: {
      'Content-Type':  'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
    },
  })
}
