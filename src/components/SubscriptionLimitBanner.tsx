'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { subscriptionApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import type { SubscriptionSnapshot } from '@/types'

/**
 * Warns the user when they're near their monthly listing quota.
 *
 *   - hidden if usage / max < 60% (not noisy)
 *   - amber banner at 60-99%
 *   - red banner at 100% (already blocked by backend, this just explains)
 *   - unlimited plans (max_listings = -1) never trigger
 *
 * Drop into pages where the user might post — listings/create, dashboard.
 */
export default function SubscriptionLimitBanner() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const t = (ar: string, en: string) => (isRTL ? ar : en)
  const Arrow = isRTL ? ArrowLeft : ArrowRight

  const { isAuthenticated } = useAuthStore()
  const [snap, setSnap] = useState<SubscriptionSnapshot | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    subscriptionApi.current()
      .then((r: any) => setSnap(r.data ?? null))
      .catch(() => setSnap(null))
  }, [isAuthenticated])

  if (!snap) return null
  const max  = snap.limits.max_listings
  const used = snap.usage.listings_posted

  // Unlimited or not at warning threshold yet
  if (max === null || max === -1 || used / max < 0.6) return null

  const remaining = Math.max(0, max - used)
  const atLimit   = remaining === 0
  const planName  = isRTL ? snap.plan.name_ar : snap.plan.name_en

  return (
    <div
      className={`rounded-xl border p-4 mb-4 flex items-start gap-3
        ${atLimit
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'}`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
        ${atLimit ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
        {atLimit ? <AlertTriangle size={18} /> : <Sparkles size={18} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${atLimit ? 'text-red-900' : 'text-amber-900'}`}>
          {atLimit
            ? t(
                `وصلت لحدّ الإعلانات الشهري لباقة ${planName}`,
                `You've reached the monthly limit for ${planName}`
              )
            : t(
                `متبقّي ${remaining} ${remaining === 1 ? 'إعلان' : 'إعلانات'} هذا الشهر`,
                `${remaining} listing${remaining === 1 ? '' : 's'} remaining this month`
              )}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          {t(
            `استخدمت ${used} من ${max} — ترقّى لباقة أعلى للحصول على إعلانات أكثر.`,
            `You've used ${used} of ${max} — upgrade for more listings.`
          )}
        </p>

        {/* Progress */}
        <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
          />
        </div>
      </div>

      <Link
        href={`/${locale}/pricing`}
        className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold
          ${atLimit
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-navy text-white hover:bg-navy-dark'}`}
      >
        {t('ترقية', 'Upgrade')} <Arrow size={12} />
      </Link>
    </div>
  )
}
