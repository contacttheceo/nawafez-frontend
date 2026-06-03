'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { MapPin, Clock, Eye, Bookmark, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Listing } from '@/types'
import { formatDistanceToNow, storageUrl } from '@/lib/utils'
import { interactionsApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

interface Props {
  listing: Listing
  mode?: 'grid' | 'list'
}

const LISTING_TYPE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  sale:        { ar: 'للبيع',        en: 'For Sale',    color: 'bg-blue-100 text-blue-700'     },
  rent:        { ar: 'للإيجار',     en: 'For Rent',    color: 'bg-amber-100 text-amber-700'   },
  wanted:      { ar: 'مطلوب',       en: 'Wanted',      color: 'bg-purple-100 text-purple-700' },
  offer:       { ar: 'معروض',       en: 'Offering',    color: 'bg-green-100 text-green-700'   },
  job:         { ar: 'وظيفة',       en: 'Job',         color: 'bg-purple-100 text-purple-700' },
  job_seeker:  { ar: 'باحث عن عمل', en: 'Job Seeker',  color: 'bg-pink-100 text-pink-700'     },
  discussion:  { ar: 'نقاش',         en: 'Discussion',  color: 'bg-red-100 text-red-700'       },
  acquisition: { ar: 'استحواذ',     en: 'Acquisition', color: 'bg-indigo-100 text-indigo-700' },
}

export function ListingCard({ listing, mode = 'grid' }: Props) {
  const locale   = useLocale()
  const t        = useTranslations('listings')
  const tb       = useTranslations('badges')
  const isRTL    = locale === 'ar'
  const router   = useRouter()
  const { user } = useAuthStore()

  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)

  const title      = isRTL ? (listing.title_ar ?? listing.title_en) : (listing.title_en ?? listing.title_ar)
  const sellerName = isRTL ? (listing.user?.name_ar ?? '') : (listing.user?.name_en ?? '')

  const sectionEmoji: Record<string, string> = {
    ma: '🏢', fleet: '🚛', contracts: '📄', jobs: '💼', forum: '💬',
  }

  const imgBg: Record<string, string> = {
    ma:        'from-green-100 to-green-200',
    fleet:     'from-blue-100 to-blue-200',
    contracts: 'from-amber-100 to-amber-200',
    jobs:      'from-purple-100 to-purple-200',
    forum:     'from-red-100 to-red-200',
  }

  /* ── Price label ── */
  const priceLabel = () => {
    if (!listing.price) return null
    const formatted = Number(listing.price).toLocaleString(isRTL ? 'ar-SA' : 'en-US')
    const suffix    = isRTL ? 'ر.س' : 'SAR'
    const negotiable = listing.price_type === 'negotiable'
      ? (isRTL ? ' (قابل للتفاوض)' : ' (Negotiable)') : ''
    return `${formatted} ${suffix}${negotiable}`
  }

  /* ── Bookmark ── */
  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      router.push(`/${locale}/auth/login`)
      return
    }
    if (bookmarking) return
    setBookmarking(true)
    try {
      if (bookmarked) {
        await interactionsApi.removeBookmark(listing.id)
        setBookmarked(false)
        toast.success(isRTL ? 'تمت الإزالة' : 'Removed')
      } else {
        await interactionsApi.bookmark(listing.id)
        setBookmarked(true)
        toast.success(isRTL ? 'تم الحفظ ✓' : 'Saved ✓')
      }
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Error occurred')
    } finally {
      setBookmarking(false)
    }
  }

  /* ── WhatsApp ── */
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!listing.contact_phone) return
    const text = encodeURIComponent(
      isRTL
        ? `مرحباً، رأيت إعلانك "${title}" على نوافذ وأود الاستفسار.`
        : `Hi, I saw your listing "${title}" on Nwafiz and I'm interested.`
    )
    const phone = listing.contact_phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  const listingTypeMeta = listing.listing_type ? LISTING_TYPE_LABELS[listing.listing_type] : null

  return (
    <Link href={`/${locale}/listings/${listing.id}`}>
      <article className={`card hover:border-emerald hover:shadow-card-lg
                           transition-all duration-200 cursor-pointer overflow-hidden group
                           ${listing.is_featured ? 'border-amber-400 shadow-amber-100 shadow-md' : ''}`}>

        {/* Image */}
        <div className={`h-44 bg-gradient-to-br ${imgBg[listing.section] || 'from-gray-100 to-gray-200'}
                         flex items-center justify-center text-5xl relative overflow-hidden`}>

          {(() => {
            // Build image URL from media array (primary source) or legacy images field
            const mediaImg = listing.media?.find(m => m.type === 'image' && m.is_primary)
                          ?? listing.media?.find(m => m.type === 'image')
            const imgUrl = mediaImg
              ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${mediaImg.path}`
              : listing.images?.[0]
            return imgUrl
              ? <img src={imgUrl} alt={title ?? ''} className="w-full h-full object-cover" />
              : <span>{sectionEmoji[listing.section]}</span>
          })()}

          {/* Featured ribbon */}
          {listing.is_featured && (
            <div className="absolute top-0 start-0 bg-amber-400 text-white text-[10px]
                            font-bold px-3 py-1 rounded-br-lg shadow">
              ⭐ {tb('featured')}
            </div>
          )}

          {/* Listing type badge */}
          {listingTypeMeta && (
            <span className={`absolute top-2 end-2 text-[10px] font-bold px-2 py-0.5 rounded-full
                              ${listingTypeMeta.color}`}>
              {isRTL ? listingTypeMeta.ar : listingTypeMeta.en}
            </span>
          )}

          {/* Hover actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200" />
          <div className="absolute top-2 end-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100
                          transition-opacity duration-200 z-10"
               style={{ top: listingTypeMeta ? '2.2rem' : '0.5rem' }}>
            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              disabled={bookmarking}
              className={`p-1.5 rounded-full shadow transition
                          ${bookmarked
                            ? 'bg-emerald text-white'
                            : 'bg-white/90 text-gray-600 hover:text-emerald hover:bg-white'}`}
              title={isRTL ? 'حفظ الإعلان' : 'Save listing'}
            >
              <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>

            {/* WhatsApp */}
            {listing.contact_phone && (
              <button
                onClick={handleWhatsApp}
                className="p-1.5 rounded-full bg-green-500 text-white shadow hover:bg-green-600 transition"
                title={isRTL ? 'واتساب' : 'WhatsApp'}
              >
                <MessageCircle size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Trust badges row */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {listing.is_financing_eligible && (
              <span className="badge-navy text-[10px]">💰 {tb('financing')}</span>
            )}
            {listing.is_ready_to_operate && (
              <span className="badge-green text-[10px]">🟢 {tb('ready')}</span>
            )}
            {listing.section === 'forum' && listing.forum_category && (() => {
              const labels: Record<string, { ar: string; en: string; emoji: string }> = {
                legal:       { ar: 'قانوني',    en: 'Legal',       emoji: '⚖️' },
                financial:   { ar: 'مالي',      en: 'Financial',   emoji: '💰' },
                operational: { ar: 'تشغيلي',   en: 'Operational', emoji: '⚙️' },
                logistics:   { ar: 'لوجستي',   en: 'Logistics',   emoji: '🚚' },
              };
              const cat = labels[listing.forum_category];
              if (!cat) return null;
              return (
                <span className="badge-navy text-[10px]">
                  {cat.emoji} {isRTL ? cat.ar : cat.en}
                </span>
              );
            })()}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
            {listing.city && (
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {listing.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDistanceToNow(listing.created_at ?? '', locale)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={11} /> {listing.views_count ?? 0}
            </span>
          </div>

          {/* Price */}
          {listing.price_type === 'on_request' ? (
            <div className="text-base font-bold text-gray-500">
              {isRTL ? 'عند الطلب' : 'On Request'}
            </div>
          ) : listing.price ? (
            <div className="text-xl font-black text-navy leading-none">
              {priceLabel()}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100
                        flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center
                            text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
              {listing.user?.avatar_url
                ? <img
                    src={storageUrl(listing.user.avatar_url)!}
                    alt={sellerName}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                : sellerName.charAt(0) || '?'}
            </div>
            <span className="truncate max-w-[100px]">{sellerName}</span>
          </div>
          <div className="flex gap-1.5">
            {listing.user?.is_trusted_payer && (
              <span className="badge-gold text-[10px]">🎖️ {tb('trusted')}</span>
            )}
            {listing.user?.role === 'business' && (
              <span className="badge-emerald text-[10px]">✔ {tb('verified')}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
