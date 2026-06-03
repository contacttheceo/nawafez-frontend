'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Share2, Copy, Check, Send, MessageCircle, Linkedin } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  url:   string
  title: string
}

/**
 * Share row for a listing detail page.
 * Goals (in order):
 *   1. WhatsApp share — the dominant channel in Saudi B2B
 *   2. Twitter/X share — for founders sharing wins
 *   3. LinkedIn share — for corporate buyers
 *   4. Copy link — universal fallback
 *   5. Native Web Share API — if available, prefer it on mobile
 */
export default function ShareButtons({ url, title }: Props) {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const [copied, setCopied] = useState(false)

  const fullUrl  = url.startsWith('http') ? url : `https://www.nwafizlogi.com${url}`
  const shareText = isRTL
    ? `${title}\n\nشاهد التفاصيل على نوافذ:`
    : `${title}\n\nSee details on Nwafiz:`

  const onWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`, '_blank')

  const onTwitter = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}&hashtags=${encodeURIComponent(isRTL ? 'لوجستيك_السعودية,نوافذ' : 'SaudiLogistics,Nwafiz')}`,
      '_blank'
    )

  const onLinkedIn = () =>
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, '_blank')

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success(t('تم نسخ الرابط ✓', 'Link copied ✓'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('فشل النسخ', 'Copy failed'))
    }
  }

  const onNativeShare = async () => {
    if (!('share' in navigator)) return onCopy()
    try {
      await navigator.share({ title, text: shareText, url: fullUrl })
    } catch {
      // User cancelled — silent
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-bold text-gray-600 me-1 hidden sm:inline">
        <Share2 size={12} className="inline me-1" />
        {t('شارك:', 'Share:')}
      </span>

      <button
        onClick={onWhatsApp}
        aria-label="WhatsApp"
        title="WhatsApp"
        className="w-9 h-9 rounded-lg bg-[#25D366] hover:bg-[#1FB855] text-white flex items-center justify-center transition-colors"
      >
        <MessageCircle size={16} />
      </button>

      <button
        onClick={onTwitter}
        aria-label="X (Twitter)"
        title="X"
        className="w-9 h-9 rounded-lg bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-colors"
      >
        <span className="font-black text-sm">𝕏</span>
      </button>

      <button
        onClick={onLinkedIn}
        aria-label="LinkedIn"
        title="LinkedIn"
        className="w-9 h-9 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-white flex items-center justify-center transition-colors"
      >
        <Linkedin size={16} />
      </button>

      <button
        onClick={onCopy}
        aria-label={t('نسخ الرابط', 'Copy link')}
        title={t('نسخ الرابط', 'Copy link')}
        className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
      >
        {copied ? <Check size={16} className="text-emerald" /> : <Copy size={16} />}
      </button>

      {/* Native share — only show if browser supports it (mobile mostly) */}
      <button
        onClick={onNativeShare}
        aria-label={t('مشاركة', 'Share')}
        title={t('مشاركة', 'Share')}
        className="sm:hidden w-9 h-9 rounded-lg bg-navy hover:bg-navy-dark text-white flex items-center justify-center transition-colors"
      >
        <Send size={14} />
      </button>
    </div>
  )
}
