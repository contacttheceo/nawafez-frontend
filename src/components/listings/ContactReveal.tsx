'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Phone, Mail, Eye, Loader2, ShieldCheck, MessageCircle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { contactApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface Props {
  listingId:  number
  section:    string
  isVisible:  boolean          // owner's opt-in flag from the listing payload
  ownerName?: string
}

/**
 * ContactReveal — appears on the listing detail page for fleet/jobs
 * listings whose owner opted-in to public contact.
 *
 * Two calls-to-action:
 *   1. WhatsApp button → server-side 302 redirect via /api/listings/{id}/wa-redirect
 *      No phone in the HTML, no scrapable URL.
 *   2. Reveal Contact button → auth-gated POST /reveal-contact, rate limit 5/day.
 *      Shows phone + email after a click.
 *
 * If the section is contracts/ma/forum, this component renders nothing —
 * those sections stay behind the internal messaging system.
 */
export default function ContactReveal({ listingId, section, isVisible, ownerName }: Props) {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const [revealed, setRevealed] = useState<{ phone?: string; email?: string } | null>(null)
  const [loading,  setLoading]  = useState(false)

  // The section must support contact opt-in AND the owner must have
  // ticked the box. Anything else falls back to internal messaging.
  const allowedSections = ['fleet', 'jobs']
  if (!allowedSections.includes(section) || !isVisible) return null

  const onReveal = async () => {
    if (!isAuthenticated) {
      toast(isRTL ? 'سجّل دخولك لعرض بيانات التواصل' : 'Sign in to see contact details')
      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setLoading(true)
    try {
      const res = await contactApi.reveal(listingId) as any
      setRevealed({ phone: res.phone, email: res.email })
      if (typeof res.remaining_today === 'number') {
        const t = isRTL
          ? `متبقى لك ${res.remaining_today} كشف اليوم`
          : `${res.remaining_today} reveals remaining today`
        toast(t)
      }
    } catch (e: any) {
      const status = e?.response?.status
      const reason = e?.response?.data?.reason
      if (status === 429) {
        toast.error(isRTL ? 'تجاوزت الحد اليومي — حاول غداً' : 'Daily reveal limit reached')
      } else if (reason === 'opt_out' || reason === 'section_not_allowed') {
        toast.error(isRTL ? 'بيانات التواصل غير متاحة لهذا الإعلان' : 'Contact not available')
      } else {
        toast.error(e?.response?.data?.message ?? (isRTL ? 'تعذّر الكشف' : 'Reveal failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-gradient-to-br from-emerald/5 to-emerald/10 border border-emerald/30 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="text-emerald" size={20} />
        <h3 className="font-black text-navy">
          {isRTL ? 'التواصل المباشر' : 'Direct Contact'}
        </h3>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed mb-4">
        {isRTL
          ? `صاحب الإعلان وافق على عرض بيانات التواصل. ${ownerName ? `تواصل مع ${ownerName} مباشرة.` : ''}`
          : `The owner has opted in to public contact. ${ownerName ? `Reach out to ${ownerName} directly.` : ''}`}
      </p>

      {/* Primary: WhatsApp (public, no phone in HTML) */}
      <a
        href={contactApi.whatsappUrl(listingId)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1FB855] text-white font-bold py-3 rounded-xl transition mb-2"
      >
        <MessageCircle size={18} />
        {isRTL ? 'تواصل عبر واتساب' : 'WhatsApp'}
      </a>

      {/* Secondary: Reveal phone + email (auth required, rate limited) */}
      {!revealed ? (
        <button
          onClick={onReveal}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-white border border-navy/20 hover:border-emerald text-navy font-bold py-3 rounded-xl transition disabled:opacity-60"
        >
          {loading
            ? <Loader2 className="animate-spin" size={18} />
            : (isAuthenticated ? <Eye size={18} /> : <Lock size={18} />)}
          {isAuthenticated
            ? (isRTL ? 'اعرض الرقم والإيميل' : 'Show phone & email')
            : (isRTL ? 'سجّل الدخول لعرض التواصل' : 'Sign in to reveal contact')}
        </button>
      ) : (
        <div className="bg-white rounded-xl p-4 space-y-2 border border-navy/10">
          {revealed.phone && (
            <a href={`tel:${revealed.phone}`}
              className="flex items-center gap-3 py-1.5 text-navy hover:text-emerald">
              <Phone size={16} className="text-emerald shrink-0" />
              <span dir="ltr" className="font-mono font-bold text-sm">{revealed.phone}</span>
            </a>
          )}
          {revealed.email && (
            <a href={`mailto:${revealed.email}`}
              className="flex items-center gap-3 py-1.5 text-navy hover:text-emerald">
              <Mail size={16} className="text-emerald shrink-0" />
              <span dir="ltr" className="font-mono text-sm break-all">{revealed.email}</span>
            </a>
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
        {isRTL
          ? 'ملاحظة: يُسجَّل كل كشف تواصل — الحد الأقصى 5 مرات يومياً لحماية بيانات المستخدمين.'
          : 'Each reveal is logged. Max 5 per day to protect user data.'}
      </p>
    </section>
  )
}
