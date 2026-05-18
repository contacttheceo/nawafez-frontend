import type { MetadataRoute } from 'next'

/**
 * Dynamic sitemap — combines static pages + all active listings.
 * Includes both /ar/ and /en/ variants of each URL.
 * Cached for 1 hour (Next.js ISR via revalidate).
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'
const API  = process.env.NEXT_PUBLIC_API_URL ?? 'https://nwafiz.creativealphat.com'

export const revalidate = 3600 // regenerate every hour

interface BackendListing {
  id:         number
  section:    string
  updated_at: string
  status:     string
}

async function fetchListings(): Promise<BackendListing[]> {
  // Each individual fetch is capped at 3 seconds so a slow backend
  // never blocks Google from getting at least the static portion of
  // the sitemap. Empty array is a safe fallback — Google still gets
  // the static URLs.
  try {
    const all: BackendListing[] = []
    for (let page = 1; page <= 10; page++) {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 3000)
      let json: any
      try {
        const res = await fetch(`${API}/api/listings?page=${page}`, {
          signal: controller.signal,
          next: { revalidate: 3600 },
        })
        if (!res.ok) { clearTimeout(t); break }
        json = await res.json()
      } catch {
        clearTimeout(t)
        break  // network/timeout — stop pagination but return what we have
      }
      clearTimeout(t)
      const items: BackendListing[] = json.data ?? []
      if (items.length === 0) break
      all.push(...items)
      if (page >= (json.last_page ?? 1)) break
    }
    return all
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await fetchListings()

  const locales = ['ar', 'en'] as const
  const now = new Date()

  // Static, high-priority routes
  const staticPaths: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '',                    priority: 1.0, changeFrequency: 'daily'   },
    { path: '/listings',           priority: 0.9, changeFrequency: 'daily'   },
    { path: '/listings?section=ma',        priority: 0.8, changeFrequency: 'daily' },
    { path: '/listings?section=fleet',     priority: 0.8, changeFrequency: 'daily' },
    { path: '/listings?section=contracts', priority: 0.8, changeFrequency: 'daily' },
    { path: '/listings?section=jobs',      priority: 0.8, changeFrequency: 'daily' },
    { path: '/listings?section=forum',     priority: 0.7, changeFrequency: 'weekly' },
    { path: '/tools',              priority: 0.6, changeFrequency: 'monthly' },
    { path: '/tools/contract-analyzer', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/auth/login',         priority: 0.3, changeFrequency: 'monthly' },
    { path: '/auth/register',      priority: 0.4, changeFrequency: 'monthly' },
    { path: '/faq',                priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy',            priority: 0.3, changeFrequency: 'monthly' },
    { path: '/terms',              priority: 0.3, changeFrequency: 'monthly' },
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap(({ path, priority, changeFrequency }) =>
    locales.map(locale => ({
      url:        `${BASE}/${locale}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ar: `${BASE}/ar${path}`,
          en: `${BASE}/en${path}`,
        },
      },
    }))
  )

  // Dynamic listing entries (both locales)
  const listingEntries: MetadataRoute.Sitemap = listings.flatMap(listing =>
    locales.map(locale => ({
      url:        `${BASE}/${locale}/listings/${listing.id}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority:   0.7,
      alternates: {
        languages: {
          ar: `${BASE}/ar/listings/${listing.id}`,
          en: `${BASE}/en/listings/${listing.id}`,
        },
      },
    }))
  )

  return [...staticEntries, ...listingEntries]
}
