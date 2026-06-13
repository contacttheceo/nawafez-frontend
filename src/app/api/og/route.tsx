import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

/**
 * Default OG image for non-listing pages (homepage, articles, about, etc.).
 *
 * Renders a 1200x630 branded card with the site name, tagline, and key
 * stat. Used whenever a page doesn't override og:image with a more
 * specific one.
 *
 * Query params (all optional):
 *   ?title=...&subtitle=...&stat=...&statLabel=...
 *
 * Cached at the edge for 1 hour.
 */

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const url      = new URL(req.url)
  const title    = url.searchParams.get('title')    || 'نوافذ'
  const subtitle = url.searchParams.get('subtitle') || 'منصة اللوجستيك B2B في السعودية'
  const stat     = url.searchParams.get('stat')     || '583+'
  const statLabel = url.searchParams.get('statLabel') || 'إعلان نشط'

  return new ImageResponse(
    (
      <div
        style={{
          width:  '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a2342 0%, #1e3a5f 50%, #10b981 100%)',
          fontFamily: 'sans-serif',
          direction:  'rtl',
          padding:    '60px',
          position:   'relative',
        }}
      >
        {/* Decorative grid */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />

        {/* Top brand bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 'auto', position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64,
              background: '#10b981',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38,
            }}>🪟</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 34, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                نوافذ
              </div>
              <div style={{ fontSize: 16, color: '#cbd5e1' }}>NWAFIZ</div>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '10px 22px',
            borderRadius: 999,
            fontSize: 20,
            color: 'white',
            fontWeight: 700,
            display: 'flex',
          }}>
            🇸🇦 السعودية
          </div>
        </div>

        {/* Center title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', marginBottom: 'auto' }}>
          <div style={{
            fontSize: title.length > 30 ? 60 : 76,
            fontWeight: 900,
            color: 'white',
            lineHeight: 1.15,
            marginBottom: 18,
            maxWidth: 1000,
          }}>
            {title}
          </div>
          <div style={{
            fontSize: 32,
            color: '#cbd5e1',
            lineHeight: 1.4,
            display: 'flex',
            maxWidth: 900,
          }}>
            {subtitle}
          </div>
        </div>

        {/* Bottom stats strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 32,
          paddingTop: 28,
          borderTop: '2px solid rgba(255,255,255,0.15)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{stat}</div>
            <div style={{ fontSize: 18, color: '#94a3b8', marginTop: 4 }}>{statLabel}</div>
          </div>
          <div style={{ flex: 1, display: 'flex' }} />
          <div style={{ fontSize: 22, fontWeight: 700, color: 'white', display: 'flex' }}>
            www.nwafizlogi.com
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
