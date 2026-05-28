'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { Bell, BellOff, BellRing, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getCurrentSupportLevel,
  subscribeUser,
  unsubscribeUser,
  isPushSupported,
  type PushSupportLevel,
} from '@/lib/push'

/**
 * Profile card — lets the user enable/disable browser push notifications.
 *
 * States:
 *   - unsupported       → grey, informational ("متصفّحك لا يدعم")
 *   - denied            → red, explains how to re-enable in browser settings
 *   - default | granted → primary CTA "تفعيل الإشعارات"
 *   - subscribed        → green, toggle to disable
 */
export default function PushNotificationToggle() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const [level,   setLevel]   = useState<PushSupportLevel | null>(null)
  const [busy,    setBusy]    = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    if (!isPushSupported()) {
      setLevel('unsupported')
      return
    }
    getCurrentSupportLevel().then(setLevel).catch(() => setLevel('unsupported'))
  }, [])

  // Hide on SSR to prevent hydration mismatch (Notification API is client-only)
  if (!hydrated) return null

  const handleEnable = async () => {
    setBusy(true)
    try {
      await subscribeUser()
      setLevel('subscribed')
      toast.success(t('تم تفعيل الإشعارات ✓', 'Notifications enabled ✓'))
    } catch (err) {
      const msg = (err as Error).message
      toast.error(msg || t('فشل التفعيل', 'Failed to enable'))
      // Refresh actual state — permission may have been denied
      getCurrentSupportLevel().then(setLevel)
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async () => {
    setBusy(true)
    try {
      await unsubscribeUser()
      setLevel('granted')
      toast.success(t('تم تعطيل الإشعارات', 'Notifications disabled'))
    } catch {
      toast.error(t('فشل التعطيل', 'Failed to disable'))
    } finally {
      setBusy(false)
    }
  }

  // ─── Render by state ───────────────────────────────────────────────────────
  if (level === 'unsupported') {
    return (
      <Card icon={<BellOff size={20} />} tone="muted"
        title={t('الإشعارات غير مدعومة', 'Notifications not supported')}
        body={t(
          'متصفّحك لا يدعم إشعارات الويب. جرّب Chrome أو Safari (16.4+) أو Edge.',
          'Your browser does not support web notifications. Try Chrome, Safari 16.4+, or Edge.'
        )}
      />
    )
  }

  if (level === 'denied') {
    return (
      <Card icon={<AlertCircle size={20} />} tone="warning"
        title={t('الإشعارات محظورة', 'Notifications blocked')}
        body={t(
          'لقد رفضت الإذن سابقاً. لتفعيلها: افتح إعدادات الموقع في المتصفح (أيقونة القفل بشريط العنوان) → الإشعارات → اسمح.',
          'You previously denied permission. Re-enable from the site settings (lock icon in address bar) → Notifications → Allow.'
        )}
      />
    )
  }

  if (level === 'subscribed') {
    return (
      <Card icon={<BellRing size={20} />} tone="success"
        title={t('الإشعارات مُفعّلة ✓', 'Notifications enabled ✓')}
        body={t(
          'ستصلك إشعارات الرسائل، التعليقات على إعلاناتك، والعروض الجديدة فوراً.',
          'You will receive instant notifications for messages, comments on your listings, and new bids.'
        )}
        action={
          <button
            onClick={handleDisable}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
          >
            {busy
              ? <Loader2 size={14} className="animate-spin inline" />
              : t('تعطيل', 'Disable')}
          </button>
        }
      />
    )
  }

  // default | granted (but not subscribed)
  return (
    <Card icon={<Bell size={20} />} tone="primary"
      title={t('فعّل الإشعارات', 'Enable notifications')}
      body={t(
        'لا تفوّت رسالة أو عرض جديد على إعلاناتك. سيُسألك المتصفح أول مرة فقط.',
        'Never miss a message or new bid on your listings. Your browser will ask once.'
      )}
      action={
        <button
          onClick={handleEnable}
          disabled={busy}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald hover:bg-emerald-dark disabled:opacity-60 inline-flex items-center gap-2"
        >
          {busy
            ? <Loader2 size={14} className="animate-spin" />
            : <Bell size={14} />}
          {t('تفعيل', 'Enable')}
        </button>
      }
    />
  )
}

// ─── Internal presentational card ────────────────────────────────────────────
type Tone = 'primary' | 'success' | 'warning' | 'muted'

const TONE_STYLES: Record<Tone, { bg: string; iconBg: string; iconText: string; title: string }> = {
  primary: { bg: 'bg-white border-gray-200',           iconBg: 'bg-navy/10',    iconText: 'text-navy',    title: 'text-gray-900' },
  success: { bg: 'bg-emerald-bg border-emerald/20',    iconBg: 'bg-emerald/15', iconText: 'text-emerald-dark', title: 'text-emerald-dark' },
  warning: { bg: 'bg-amber-50 border-amber-200',       iconBg: 'bg-amber-100',  iconText: 'text-amber-700', title: 'text-amber-900' },
  muted:   { bg: 'bg-gray-50 border-gray-200',         iconBg: 'bg-gray-200',   iconText: 'text-gray-500',  title: 'text-gray-700' },
}

function Card({
  icon, tone, title, body, action,
}: {
  icon:    React.ReactNode
  tone:    Tone
  title:   string
  body:    string
  action?: React.ReactNode
}) {
  const s = TONE_STYLES[tone]
  return (
    <div className={`rounded-xl border ${s.bg} p-4 flex items-start gap-4`}>
      <div className={`shrink-0 w-10 h-10 rounded-lg ${s.iconBg} ${s.iconText} flex items-center justify-center`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-sm ${s.title}`}>{title}</h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{body}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
