'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import { WifiOff, RefreshCw } from 'lucide-react'

/**
 * Offline fallback — served by the service worker when a navigation
 * fails (no network + no cached page for the URL).
 *
 * Kept self-contained: no API calls, no auth-dependent components.
 */
export default function OfflinePage() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'

  const t = (ar: string, en: string) => (isRTL ? ar : en)

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy/5 to-white px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-navy/10 flex items-center justify-center">
          <WifiOff size={40} className="text-navy" />
        </div>

        <Image
          src="/logo.png"
          alt="نوافذ"
          width={140}
          height={110}
          priority
          className="mx-auto mb-6 opacity-90"
        />

        <h1 className="text-2xl font-bold text-navy mb-3">
          {t('لا يوجد اتصال بالإنترنت', 'No internet connection')}
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          {t(
            'لا تقلق — صفحاتك التي زرتها مؤخراً متاحة دون اتصال. تحقّق من اتصالك ثم حاول مجدداً.',
            'No worries — your recently visited pages are available offline. Check your connection and try again.'
          )}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-white font-semibold hover:bg-navy/90 transition-colors"
        >
          <RefreshCw size={18} />
          {t('إعادة المحاولة', 'Try again')}
        </button>

        <p className="mt-8 text-xs text-gray-400">
          {t(
            'منصة نوافذ تعمل بتقنية PWA — بعض الصفحات تعمل بدون إنترنت.',
            'Nwafiz is a PWA — some pages work offline.'
          )}
        </p>
      </div>
    </main>
  )
}
