import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'نوافذ — منصة اللوجستيك B2B',
    template: '%s | نوافذ',
  },
  description: 'منصة السوق اللوجستي B2B الأولى في السعودية. تداول الأصول والعقود والتراخيص اللوجستية في بيئة موثوقة.',
  keywords: ['لوجستيك', 'نقل', 'أسطول', 'استحواذ', 'سعودية', 'B2B'],
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    siteName: 'نوافذ',
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
      <body className={isRTL ? 'font-arabic' : 'font-sans'}>
        <NextIntlClientProvider messages={messages}>
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
