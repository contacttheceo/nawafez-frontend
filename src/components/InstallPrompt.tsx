'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { Download, X, Share, PlusSquare } from 'lucide-react'

/**
 * PWA install prompt — appears as a small dismissable banner.
 *
 *   - Android / Chromium desktop: captures `beforeinstallprompt`, fires
 *     the native install flow when the user taps "Install".
 *   - iOS Safari: no install API exists, so we show step-by-step
 *     instructions ("Share → Add to Home Screen") in a modal.
 *
 * The banner is suppressed for 14 days after dismiss, and forever
 * after a successful install (we detect `display-mode: standalone`).
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY        = 'nwafiz:pwa-install-dismissed-at'
const DISMISS_TTL_MS     = 14 * 24 * 60 * 60 * 1000  // 14 days

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari-specific
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

function isRecentlyDismissed() {
  if (typeof localStorage === 'undefined') return false
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const ts = parseInt(raw, 10)
  return Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS
}

export default function InstallPrompt() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible,        setVisible]        = useState(false)
  const [showIosModal,   setShowIosModal]   = useState(false)

  useEffect(() => {
    if (isStandalone() || isRecentlyDismissed()) return

    // Android / desktop Chromium path
    const onBefore = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBefore)

    // iOS path — no event, just show banner after a beat
    if (isIOS()) {
      const timer = setTimeout(() => setVisible(true), 4000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', onBefore)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', onBefore)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setVisible(false)
      if (choice.outcome === 'dismissed') {
        localStorage.setItem(DISMISS_KEY, Date.now().toString())
      }
    } else if (isIOS()) {
      setShowIosModal(true)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }

  if (!visible) return null

  return (
    <>
      {/* Banner — sits above iOS home indicator via env(safe-area-inset-bottom) */}
      <div
        className="fixed inset-x-4 z-[60] mx-auto max-w-md bg-white rounded-2xl shadow-card-lg border border-gray-200 p-4 flex items-center gap-3 nwafiz-slide-up"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        role="dialog"
        aria-labelledby="install-prompt-title"
      >
        <div className="shrink-0 w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center">
          <Download size={22} className="text-navy" />
        </div>

        <div className="flex-1 min-w-0">
          <p id="install-prompt-title" className="font-semibold text-sm text-gray-900 leading-tight">
            {t('ثبّت نوافذ على جوالك', 'Install Nawafez on your device')}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">
            {t('وصول أسرع، إشعارات فورية، يعمل بدون إنترنت', 'Faster access, instant alerts, works offline')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-emerald text-white text-xs font-semibold hover:bg-emerald/90"
          >
            {t('تثبيت', 'Install')}
          </button>
          <button
            onClick={handleDismiss}
            aria-label={t('إغلاق', 'Dismiss')}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS instructions modal */}
      {showIosModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-navy">
                {t('كيف تُثبّت نوافذ على iPhone', 'Install Nawafez on iPhone')}
              </h2>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
                aria-label={t('إغلاق', 'Close')}
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <ol className="space-y-4 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  {t('اضغط زر المشاركة', 'Tap the Share button')}
                  <Share size={18} className="inline mx-1.5 text-blue-500" />
                  {t('في شريط Safari', 'in Safari toolbar')}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {t('اختر', 'Choose')}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded font-medium">
                    <PlusSquare size={14} />
                    {t('إضافة إلى الشاشة الرئيسية', 'Add to Home Screen')}
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  {t('اضغط "إضافة" في الأعلى — وستجد أيقونة نوافذ على شاشتك الرئيسية', 'Tap "Add" in the top right — Nawafez will appear on your home screen')}
                </div>
              </li>
            </ol>

            <button
              onClick={() => {
                setShowIosModal(false)
                handleDismiss()
              }}
              className="mt-6 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('فهمت', 'Got it')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
