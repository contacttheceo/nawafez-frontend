import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/api/og/',        // dynamic OG images — Twitter/Facebook/WhatsApp need these
        ],
        disallow: [
          '/api/ai/',        // AI endpoints — keep them out of crawl
          '/api/push/',      // push API — internal only
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
    // Note: intentionally NOT emitting `Host:` directive — it is Yandex-
    // specific, and Bing/Google/DuckDuckGo flag it as a syntax error.
    // Canonical host is enforced via the www→apex 307 redirect Vercel
    // handles automatically for the domain.
  }
}
