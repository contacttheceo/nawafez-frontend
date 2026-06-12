import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

/**
 * Dynamic OG (Open Graph) image for /listings/[id].
 *
 * Renders a 1200x630 branded card with the listing's title, city, price,
 * and primary photo. Used by WhatsApp/X/LinkedIn/Telegram link previews.
 *
 * Cached at the edge for 1 hour (matches the page revalidate window).
 */

export const runtime = 'edge'

const API  = process.env.NEXT_PUBLIC_API_URL ?? 'https://nwafiz.creativealphat.com'
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

const SECTION_LABEL: Record<string, string> = {
  fleet:     'أسطول',
  contracts: 'عقود',
  ma:        'استحواذ',
  jobs:      'توظيف',
  forum:     'منتدى',
}

interface BackendListing {
  id:         number
  title_ar:   string | null
  title_en:   string | null
  city:       string | null
  price:      number | null
  currency:   string | null
  section:    string
  media?:     Array<{ path: string; type: string; is_primary?: boolean }>
}

async function fetchListing(id: string): Promise<BackendListing | null> {
  try {
    const res = await fetch(`${API}/api/listings/${id}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch { return null }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const listing = await fetchListing(id)

  const title   = listing?.title_ar ?? listing?.title_en ?? 'نوافذ — منصة اللوجستيك B2B'
  const city    = listing?.city ?? 'السعودية'
  const price   = listing?.price
  const section = listing && SECTION_LABEL[listing.section] || 'إعلان'
  const primary = listing?.media?.find(m => m.type === 'image' && m.is_primary)
               ?? listing?.media?.find(m => m.type === 'image')
  const imgUrl  = primary ? `${API}/uploads/${primary.path}` : null

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #0a2342 0%, #1e3a5f 100%)',
          fontFamily: 'sans-serif',
          direction: 'rtl',
          position: 'relative',
        }}
      >
        {/* Right: photo (or section color block) */}
        <div
          style={{
            width: '540px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: imgUrl ? '#111' : '#10b981',
            overflow: 'hidden',
          }}
        >
          {imgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl}
              alt=""
              width={540}
              height={630}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ fontSize: 220, color: 'white' }}>📦</div>
          )}
        </div>

        {/* Left: text */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 50px',
            color: 'white',
          }}
        >
          {/* Top: section chip + brand */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                background: '#10b981',
                padding: '8px 22px',
                borderRadius: '999px',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {section}
            </div>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em' }}>
              نوافذ
            </div>
          </div>

          {/* Middle: title */}
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 60 ? 44 : 56,
              fontWeight: 900,
              lineHeight: 1.25,
              color: 'white',
              maxWidth: '580px',
            }}
          >
            {title.length > 110 ? title.slice(0, 107) + '…' : title}
          </div>

          {/* Bottom: city + price */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                color: '#cbd5e1',
                alignItems: 'center',
                gap: 10,
              }}
            >
              📍 {city}
            </div>
            {price ? (
              <div
                style={{
                  display: 'flex',
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#fbbf24',
                  alignItems: 'baseline',
                  gap: 10,
                }}
              >
                {Number(price).toLocaleString('ar-SA')}
                <span style={{ fontSize: 26, color: '#94a3b8' }}>ر.س</span>
              </div>
            ) : (
              <div style={{ display: 'flex', fontSize: 28, color: '#10b981', fontWeight: 700 }}>
                {BASE.replace('https://', '')}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    }
  )
}
