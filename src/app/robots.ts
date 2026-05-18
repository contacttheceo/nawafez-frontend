import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // Next.js API routes (AI etc.) — not for crawlers
          '/*/admin',        // admin panel
          '/*/dashboard',    // user dashboards
          '/*/profile',      // private profile
          '/*/messages',     // private messages
          '/*/bookmarks',    // private bookmarks
          '/*/auth/reset-password',
          '/*/auth/verify-email',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host:    BASE,
  }
}
