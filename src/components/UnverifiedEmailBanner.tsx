'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Mail, X, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api'

/**
 * Sticky amber banner shown at the top of any auth-required page when the
 * current user has not verified their email. Disappears after dismiss for
 * 24h via localStorage, and entirely once the user verifies.
 *
 * Includes a "resend" button that calls /api/auth/resend-verification.
 */

const DISMISS_KEY = 'nwafiz:verify-banner-dismissed-at'
const DISMISS_TTL = 24 * 60 * 60 * 1000   // 24h

function isRecentlyDismissed() {
  if (typeof localStorage === 'undefined') return false
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const ts = parseInt(raw, 10)
  return Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL
}

export default function UnverifiedEmailBanner() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const { user, isAuthenticated } = useAuthStore()
  const [dismissed, setDismissed] = useState(isRecentlyDismissed())
  const [resending, setResending] = useState(false)

  // Hide on SSR / when not logged in / when already verified / when dismissed
  if (!isAuthenticated || !user) return null
  if (user.email_verified_at) return null
  if (dismissed) return null

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.resendVerification()
      toast.success(t(
        'تم إرسال رابط التحقق إلى بريدك ✓ تحقق من spam لو لم تجده.',
        'Verification link sent ✓ Check spam if you don\'t see it.'
      ), { duration: 6000 })
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? t('فشل الإرسال', 'Resend failed'))
    } finally {
      setResending(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setDismissed(true)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
          <Mail size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            {t('فعّل حسابك بالتحقق من بريدك', 'Verify your email to activate your account')}
          </p>
          <p className="text-xs text-amber-700 truncate">
            {t(
              `أرسلنا رابط التحقق إلى ${user.email}. لا يمكنك نشر إعلانات أو رسائل قبل التحقق.`,
              `We sent a verification link to ${user.email}. You can't post listings or messages until verified.`
            )}
          </p>
        </div>
        <button
          onClick={handleResend}
          disabled={resending}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-60"
        >
          {resending
            ? <Loader2 size={12} className="animate-spin" />
            : <CheckCircle2 size={12} />}
          {t('أعد إرسال الرابط', 'Resend link')}
        </button>
        <button
          onClick={handleDismiss}
          aria-label={t('إخفاء', 'Dismiss')}
          className="shrink-0 p-1 rounded-lg hover:bg-amber-100 text-amber-600"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
