import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

// Private surfaces the general crawler and the AI crawlers must avoid.
// Listings themselves stay crawlable — they are public inventory — but
// user-area routes never are.
const PRIVATE_DISALLOW = [
  '/api/ai/',
  '/api/push/',
  '/*/admin',
  '/*/dashboard',
  '/*/profile',
  '/*/messages',
  '/*/bookmarks',
  '/*/auth/reset-password',
  '/*/auth/verify-email',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Baseline for all search crawlers (Google, Bing, DuckDuckGo, …).
      {
        userAgent: '*',
        allow: [
          '/',
          '/api/og/',   // dynamic OG images — social previews need these
        ],
        disallow: PRIVATE_DISALLOW,
      },

      // Explicit allows for the AI crawlers that train / cite content.
      // Keep listings crawlable too (fresh inventory = fresher AI
      // answers); only private user areas remain blocked. The explicit
      // rules make our intent legible to the LLM provider's auditors
      // and let us tighten later if needed.
      //
      // OpenAI (ChatGPT training + ChatGPT browsing)
      { userAgent: 'GPTBot',       allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'OAI-SearchBot',allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: PRIVATE_DISALLOW },
      // Anthropic
      { userAgent: 'ClaudeBot',    allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'Claude-Web',   allow: '/', disallow: PRIVATE_DISALLOW },
      // Perplexity
      { userAgent: 'PerplexityBot',allow: '/', disallow: PRIVATE_DISALLOW },
      // Google-Extended controls whether Google uses our content to train
      // Gemini (separate from Google Search indexing).
      { userAgent: 'Google-Extended', allow: '/', disallow: PRIVATE_DISALLOW },
      // Common Crawl — feeds the training corpora of many open models.
      { userAgent: 'CCBot',        allow: '/', disallow: PRIVATE_DISALLOW },
      // Apple / Meta / Bytedance crawlers
      { userAgent: 'Applebot',          allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'Applebot-Extended', allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'Meta-ExternalAgent',allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'FacebookBot',       allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'Bytespider',        allow: '/', disallow: PRIVATE_DISALLOW },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    // Note: intentionally NOT emitting `Host:` directive — it is Yandex-
    // specific, and Bing/Google/DuckDuckGo flag it as a syntax error.
    // Canonical host is enforced via the www→apex 307 redirect Vercel
    // handles automatically for the domain.
  }
}
