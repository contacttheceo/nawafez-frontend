/**
 * Manual sitemap.xml generator.
 *
 * We bypass Next.js's MetadataRoute.Sitemap helper because it does NOT
 * escape `&` characters in query strings — URLs like
 *   /listings?section=fleet&type=sale
 * produce invalid XML ("EntityRef: expecting ';'") that Google rejects
 * whole, dropping the entire sitemap instead of just the bad URLs.
 *
 * Writing the XML by hand lets us guarantee every `&` becomes `&amp;`.
 *
 * Cached for 1 hour at the edge via the Cache-Control header.
 */

import { NextResponse } from 'next/server'
import { ARTICLES } from '@/content/articles'
import { CITIES } from '@/content/cities'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'
const API  = process.env.NEXT_PUBLIC_API_URL ?? 'https://nwafiz.creativealphat.com'

interface BackendListing {
  id:         number
  updated_at: string
}

/** Escape the 5 XML-significant characters. Only & and < and > really matter
 *  for our URLs, but we cover all five for correctness. */
function xml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function fetchListings(): Promise<BackendListing[]> {
  // Dedup by id — pagination can return the same row twice if its
  // updated_at changes between page fetches (it shifts back to page 1
  // while page 2 is being read), which would emit duplicate <loc>
  // entries that Google flags as a quality issue.
  const byId = new Map<number, BackendListing>()
  for (let page = 1; page <= 10; page++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 3000)
      const res = await fetch(`${API}/api/listings?page=${page}`, {
        signal: ctrl.signal,
        next:   { revalidate: 3600 },
      })
      clearTimeout(timer)
      if (!res.ok) break
      const json: { data?: BackendListing[]; last_page?: number } = await res.json()
      const items = json.data ?? []
      if (items.length === 0) break
      for (const item of items) byId.set(item.id, item)
      if (page >= (json.last_page ?? 1)) break
    } catch {
      break
    }
  }
  return Array.from(byId.values())
}

type ChangeFreq = 'daily' | 'weekly' | 'monthly'

const LOCALES = ['ar', 'en'] as const

// Every static path the site exposes to the public web. Add new high-value
// pages here. Order doesn't matter — priority controls weighting.
const STATIC_PATHS: { path: string; priority: number; changeFrequency: ChangeFreq }[] = [
  { path: '',                                                                  priority: 1.0, changeFrequency: 'daily'   },
  { path: '/listings',                                                         priority: 0.9, changeFrequency: 'daily'   },

  // Section pages
  { path: '/listings?section=ma',                                              priority: 0.8, changeFrequency: 'daily'   },
  { path: '/listings?section=fleet',                                           priority: 0.8, changeFrequency: 'daily'   },
  { path: '/listings?section=fleet&type=sale',                                 priority: 0.7, changeFrequency: 'daily'   },
  { path: '/listings?section=fleet&type=rent',                                 priority: 0.7, changeFrequency: 'daily'   },
  { path: '/listings?section=contracts',                                       priority: 0.8, changeFrequency: 'daily'   },
  { path: '/listings?section=contracts&type=offer',                            priority: 0.7, changeFrequency: 'daily'   },
  { path: '/listings?section=contracts&type=wanted',                           priority: 0.7, changeFrequency: 'daily'   },
  { path: '/listings?section=jobs',                                            priority: 0.8, changeFrequency: 'daily'   },
  { path: '/listings?section=forum',                                           priority: 0.7, changeFrequency: 'weekly'  },
  { path: '/listings?section=forum&forum_category=legal',                      priority: 0.6, changeFrequency: 'weekly'  },
  { path: '/listings?section=forum&forum_category=financial',                  priority: 0.6, changeFrequency: 'weekly'  },
  { path: '/listings?section=forum&forum_category=operational',                priority: 0.6, changeFrequency: 'weekly'  },
  { path: '/listings?section=forum&forum_category=logistics',                  priority: 0.6, changeFrequency: 'weekly'  },

  // City deep-links — high value for local SEO
  { path: '/listings?city=' + encodeURIComponent('الرياض'),                    priority: 0.7, changeFrequency: 'daily'   },
  { path: '/listings?city=' + encodeURIComponent('جدة'),                       priority: 0.7, changeFrequency: 'daily'   },
  { path: '/listings?city=' + encodeURIComponent('الدمام'),                    priority: 0.7, changeFrequency: 'daily'   },
  { path: '/listings?city=' + encodeURIComponent('مكة المكرمة'),               priority: 0.6, changeFrequency: 'daily'   },
  { path: '/listings?city=' + encodeURIComponent('المدينة المنورة'),           priority: 0.6, changeFrequency: 'daily'   },
  { path: '/listings?city=' + encodeURIComponent('الخبر'),                     priority: 0.6, changeFrequency: 'daily'   },
  { path: '/listings?city=' + encodeURIComponent('الطائف'),                    priority: 0.5, changeFrequency: 'daily'   },
  { path: '/listings?city=' + encodeURIComponent('تبوك'),                      priority: 0.5, changeFrequency: 'daily'   },
  { path: '/listings?city=' + encodeURIComponent('بريدة'),                     priority: 0.5, changeFrequency: 'daily'   },
  { path: '/listings?city=' + encodeURIComponent('الأحساء'),                   priority: 0.5, changeFrequency: 'daily'   },

  // Marketing + utility pages
  { path: '/pricing',                                                          priority: 0.7, changeFrequency: 'weekly'  },
  { path: '/sitemap',                                                          priority: 0.5, changeFrequency: 'monthly' },
  { path: '/tools',                                                            priority: 0.6, changeFrequency: 'monthly' },
  { path: '/tools/contract-analyzer',                                          priority: 0.6, changeFrequency: 'monthly' },
  { path: '/auth/login',                                                       priority: 0.3, changeFrequency: 'monthly' },
  { path: '/auth/register',                                                    priority: 0.4, changeFrequency: 'monthly' },
  { path: '/faq',                                                              priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy',                                                          priority: 0.3, changeFrequency: 'monthly' },
  { path: '/terms',                                                            priority: 0.3, changeFrequency: 'monthly' },
]

// Build one <url> entry with xhtml:link hreflang alternates for both locales.
function buildUrl(locale: 'ar' | 'en', path: string, lastmod: string, priority: number, changefreq: ChangeFreq): string {
  const loc = xml(`${BASE}/${locale}${path}`)
  const altAr = xml(`${BASE}/ar${path}`)
  const altEn = xml(`${BASE}/en${path}`)
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${altAr}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${altEn}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${altAr}"/>
  </url>`
}

export const revalidate = 3600   // re-render at most once an hour

export async function GET() {
  const listings = await fetchListings()
  const now = new Date().toISOString()

  const staticEntries = STATIC_PATHS.flatMap(({ path, priority, changeFrequency }) =>
    LOCALES.map((locale) => buildUrl(locale, path, now, priority, changeFrequency))
  )

  const listingEntries = listings.flatMap((listing) => {
    const lastmod = listing.updated_at
      ? new Date(listing.updated_at).toISOString()
      : now
    return LOCALES.map((locale) =>
      buildUrl(locale, `/listings/${listing.id}`, lastmod, 0.7, 'weekly')
    )
  })

  // Editorial articles — long-form SEO content
  const articleIndex = LOCALES.map(locale =>
    buildUrl(locale, '/articles', now, 0.8, 'weekly')
  )
  const articleEntries = ARTICLES.flatMap(a => {
    const lastmod = new Date(a.updated_at).toISOString()
    return LOCALES.map(locale =>
      buildUrl(locale, `/articles/${a.slug}`, lastmod, 0.7, 'monthly')
    )
  })

  // City landing pages — high commercial intent for local searches
  const cityIndex = LOCALES.map(locale =>
    buildUrl(locale, '/cities', now, 0.7, 'weekly')
  )
  const cityEntries = CITIES.flatMap(c =>
    LOCALES.map(locale =>
      buildUrl(locale, `/cities/${c.slug}`, now, 0.8, 'daily')
    )
  )

  // Tools — interactive utilities that drive engagement + backlinks
  const toolEntries = LOCALES.flatMap(locale => [
    buildUrl(locale, '/tools',                     now, 0.6, 'monthly'),
    buildUrl(locale, '/tools/contract-analyzer',   now, 0.6, 'monthly'),
    buildUrl(locale, '/tools/rental-calculator',   now, 0.7, 'monthly'),
  ])

  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticEntries, ...articleIndex, ...articleEntries, ...cityIndex, ...cityEntries, ...toolEntries, ...listingEntries].join('\n')}
</urlset>`

  return new NextResponse(xmlBody, {
    status: 200,
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      // Cache at the CDN edge for 1 hour, stale-while-revalidate for 1 day
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
