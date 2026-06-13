import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
  // We always prefix the URL with the locale (/ar or /en), so detection
  // via cookie/header is unnecessary. Disabling it stops the middleware
  // from setting NEXT_LOCALE on every response, which was forcing every
  // route into dynamic mode (cache-control: no-store) and killing SEO.
  localeDetection: false,
})
