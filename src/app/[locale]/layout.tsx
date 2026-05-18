import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Toaster } from 'react-hot-toast'
import AuthSync from '@/components/AuthSync'
import InactivityGuard from '@/components/InactivityGuard'
import './globals.css'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nwafizlogi.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'نوافذ — منصة اللوجستيك B2B',
    template: '%s | نوافذ',
  },
  description: 'منصة السوق اللوجستي B2B الأولى في السعودية. تداول الأصول والعقود والتراخيص اللوجستية في بيئة موثوقة.',
  keywords: ['لوجستيك', 'نقل', 'أسطول', 'استحواذ', 'سعودية', 'B2B', 'logistics', 'fleet', 'Saudi Arabia'],
  authors: [{ name: 'نوافذ', url: BASE }],
  creator: 'Creative Alpha Commercial',
  publisher: 'Creative Alpha Commercial',
  icons: {
    icon:  '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    siteName: 'نوافذ',
    images: [
      { url: '/logo.png', width: 800, height: 626, alt: 'نوافذ' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'نوافذ — منصة اللوجستيك B2B',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
}

// Organization schema — applies site-wide
const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type':    'Organization',
  name:       'نوافذ',
  alternateName: 'Nawafez',
  url:        BASE,
  logo:       `${BASE}/logo.png`,
  description: 'منصة اللوجستيك B2B الأولى في السعودية',
  address: {
    '@type':         'PostalAddress',
    addressCountry:  'SA',
  },
  contactPoint: {
    '@type':       'ContactPoint',
    email:         'info@nwafizlogi.com',
    telephone:     '+966556716705',
    contactType:   'customer service',
    availableLanguage: ['Arabic', 'English'],
  },
}

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:       'نوافذ',
  url:        BASE,
  inLanguage: ['ar', 'en'],
  potentialAction: {
    '@type':       'SearchAction',
    target:        `${BASE}/ar/listings?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'ar' | 'en')) {
    notFound()
  }

  const messages = await getMessages()
  const isRTL = locale === 'ar'

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        {/* hreflang — tells search engines about the language variants */}
        <link rel="alternate" hrefLang="ar"     href={`${BASE}/ar`} />
        <link rel="alternate" hrefLang="en"     href={`${BASE}/en`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE}/ar`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
        />
      </head>
      <body className={isRTL ? 'font-arabic' : 'font-sans'}>
        <NextIntlClientProvider messages={messages}>
          <AuthSync />
          <InactivityGuard />
          {children}
          <Toaster
            position={isRTL ? 'bottom-left' : 'bottom-right'}
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: 'inherit',
                direction: isRTL ? 'rtl' : 'ltr',
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
