import createNextIntlPlugin from 'next-intl/plugin'
import withSerwistInit from '@serwist/next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// PWA service worker (built from src/sw.ts → public/sw.js).
// Disabled in dev to avoid stale-cache headaches while iterating.
const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.freehostia.com' },
      { protocol: 'https', hostname: 'nwafiz.creativealphat.com' },
    ],
  },
}

export default withSerwist(withNextIntl(nextConfig))
