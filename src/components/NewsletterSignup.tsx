'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Mail, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://nwafiz.creativealphat.com'

/**
 * Inline newsletter signup card.
 *
 * Drops into any page (footer, home, articles index) via:
 *   <NewsletterSignup source="footer" />
 *
 * The `source` is forwarded to the backend so we can see which placement
 * converts best.
 */
export default function NewsletterSignup({ source = 'unknown' }: { source?: string }) {
  const locale = useLocale()
  const isRTL  = locale === 'ar'

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || loading) return

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/newsletter/subscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ email, locale, source }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(isRTL ? 'حاول لاحقاً' : 'Try again later')
        } else {
          toast.error(json.message || (isRTL ? 'تعذّر الاشتراك' : 'Signup failed'))
        }
        return
      }

      setDone(true)
      toast.success(json.message || (isRTL ? 'تم الاشتراك ✓' : 'Subscribed ✓'))
    } catch {
      toast.error(isRTL ? 'تحقق من الاتصال' : 'Check your connection')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-emerald/10 border border-emerald rounded-2xl p-5 text-center">
        <Check className="text-emerald mx-auto mb-2" size={28} />
        <p className="font-bold text-emerald text-sm">
          {isRTL ? 'تم الاشتراك ✓ راقب بريدك' : 'Subscribed ✓ Check your inbox'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-navy to-navy/90 text-white rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Mail size={18} className="text-emerald" />
        <h3 className="font-black text-base">
          {isRTL ? 'النشرة الأسبوعية' : 'Weekly Newsletter'}
        </h3>
      </div>
      <p className="text-xs opacity-90 mb-4 leading-relaxed">
        {isRTL
          ? 'أبرز الإعلانات، تحديثات السوق، ومحتوى تعليمي — مرة في الأسبوع، لا spam.'
          : 'Top listings, market updates, and educational content — weekly, no spam.'}
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={isRTL ? 'بريدك الإلكتروني' : 'Your email'}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="flex-1 px-4 py-2.5 rounded-xl text-navy text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald hover:bg-emerald-600 disabled:opacity-50
                     px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
        >
          {loading
            ? <Loader2 size={14} className="animate-spin" />
            : (isRTL ? 'اشترك' : 'Subscribe')}
        </button>
      </form>
    </div>
  )
}
