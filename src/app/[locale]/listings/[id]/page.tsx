'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  MapPin, Calendar, Eye, Star, Shield, Truck,
  DollarSign, Phone, MessageSquare, Bookmark, Flag, ArrowRight, MessageCircle
} from 'lucide-react';
import { listingsApi, interactionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatPrice, formatDistanceToNow } from '@/lib/utils';
import type { Listing } from '@/types';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Lightbox from '@/components/ui/Lightbox';
import ReportModal from '@/components/ui/ReportModal';
import { ListingCard } from '@/components/ui/ListingCard';

const SECTION_LABELS: Record<string, { ar: string; en: string }> = {
  ma:        { ar: 'الاستحواذ والدمج', en: 'M&A'       },
  fleet:     { ar: 'الأسطول',          en: 'Fleet'     },
  contracts: { ar: 'العقود',            en: 'Contracts' },
  jobs:      { ar: 'الوظائف',          en: 'Jobs'      },
  forum:     { ar: 'المنتدى',          en: 'Forum'     },
};

export default function ListingDetailPage() {
  const { id }                    = useParams<{ id: string }>();
  const locale                    = useLocale();
  const router                    = useRouter();
  const isRTL                     = locale === 'ar';
  const { user, isAuthenticated } = useAuthStore();

  const [listing,    setListing]    = useState<Listing | null>(null);
  const [similar,    setSimilar]    = useState<Listing[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [activeImg,  setActiveImg]  = useState(0);
  const [lightbox,   setLightbox]   = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBid,    setShowBid]    = useState(false);
  const [bidAmount,  setBidAmount]  = useState('');
  const [bidMsg,     setBidMsg]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── Load listing ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await listingsApi.getOne(Number(id));
        const data = res.data ?? res;
        setListing(data);
        listingsApi.recordView(Number(id)).catch(() => {});

        // Fetch similar listings
        if (data.section) {
          listingsApi.getAll({
            section: data.section,
            city: data.city,
            limit: 5,
            page: 1,
          }).then(r => {
            const all: Listing[] = r.data ?? r;
            setSimilar(all.filter((l: Listing) => l.id !== data.id).slice(0, 4));
          }).catch(() => {});
        }
      } catch {
        router.push(`/${locale}/listings`);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Bookmark ── */
  const handleBookmark = async () => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    try {
      if (bookmarked) {
        await interactionsApi.removeBookmark(Number(id));
        setBookmarked(false);
        toast.success(isRTL ? 'تمت إزالة الإعلان من المفضلة' : 'Removed from bookmarks');
      } else {
        await interactionsApi.bookmark(Number(id));
        setBookmarked(true);
        toast.success(isRTL ? 'تمت إضافة الإعلان للمفضلة' : 'Added to bookmarks');
      }
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Something went wrong');
    }
  };

  /* ── Bid ── */
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error(isRTL ? 'يجب أن يكون المبلغ أكبر من صفر' : 'Amount must be greater than zero');
      return;
    }
    setSubmitting(true);
    try {
      await interactionsApi.submitBid(Number(id), { amount: Number(bidAmount), message: bidMsg });
      toast.success(isRTL ? 'تم تقديم عرض السعر بنجاح' : 'Bid submitted successfully');
      setShowBid(false); setBidAmount(''); setBidMsg('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (isRTL ? 'حدث خطأ' : 'Error'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Report ── */
  const handleReportSubmit = async (reason: string, details: string) => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    try {
      await interactionsApi.report(Number(id), { reason, details });
      toast.success(isRTL ? 'تم الإبلاغ عن الإعلان' : 'Report submitted');
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Error');
    }
  };

  /* ── WhatsApp ── */
  const handleWhatsApp = () => {
    if (!listing?.contact_phone) return;
    const title = isRTL ? (listing.title_ar ?? listing.title_en) : (listing.title_en ?? listing.title_ar);
    const text = encodeURIComponent(
      isRTL
        ? `مرحباً، رأيت إعلانك "${title}" على نوافذ وأود الاستفسار.`
        : `Hi, I saw your listing "${title}" on Nawafez and I'm interested.`
    );
    const phone = listing.contact_phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-6 w-2/3" />
          <div className="skeleton h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const title      = isRTL ? (listing.title_ar ?? listing.title_en) : (listing.title_en ?? listing.title_ar);
  const desc       = isRTL ? listing.description_ar : listing.description_en;
  const section    = SECTION_LABELS[listing.section] ?? { ar: listing.section, en: listing.section };
  const sellerName = isRTL ? listing.user?.name_ar : listing.user?.name_en;

  /* Build image URLs */
  const rawImages  = listing.media?.filter((m: any) => m.type === 'image') ?? [];
  const imageUrls  = rawImages.length > 0
    ? rawImages.map((img: any) => `${process.env.NEXT_PUBLIC_API_URL}/uploads/${img.path}`)
    : (listing.images ?? []);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href={`/${locale}`} className="hover:text-emerald">{isRTL ? 'الرئيسية' : 'Home'}</Link>
          <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
          <Link href={`/${locale}/listings`} className="hover:text-emerald">{isRTL ? 'الإعلانات' : 'Listings'}</Link>
          <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
          <span className="text-gray-700 truncate max-w-xs">{title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: images + details ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Images */}
            {imageUrls.length > 0 ? (
              <div className="space-y-3">
                <div
                  className="rounded-2xl overflow-hidden aspect-video bg-gray-100 cursor-zoom-in relative group"
                  onClick={() => setLightbox(true)}
                >
                  <img
                    src={imageUrls[activeImg]}
                    alt={title ?? ''}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
                      {isRTL ? 'انقر للتكبير' : 'Click to zoom'}
                    </span>
                  </div>
                  {imageUrls.length > 1 && (
                    <span className="absolute bottom-3 end-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                      {activeImg + 1} / {imageUrls.length}
                    </span>
                  )}
                </div>

                {imageUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {imageUrls.map((url: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition
                                    ${i === activeImg ? 'border-emerald' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={url} alt={`${title} — ${isRTL ? 'صورة' : 'image'} ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl aspect-video bg-gradient-to-br from-navy/10 to-emerald/10 flex items-center justify-center">
                <Truck className="w-20 h-20 text-navy/20" />
              </div>
            )}

            {/* Title + meta */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="badge-navy text-xs">{isRTL ? section.ar : section.en}</span>
                {listing.is_featured && (
                  <span className="badge-gold text-xs">{isRTL ? '⭐ مميز' : '⭐ Featured'}</span>
                )}
                {listing.listing_type && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                    {listing.listing_type === 'for_sale'  ? (isRTL ? 'للبيع'   : 'For Sale')   :
                     listing.listing_type === 'for_rent'  ? (isRTL ? 'للإيجار' : 'For Rent')   :
                     listing.listing_type === 'wanted'    ? (isRTL ? 'مطلوب'   : 'Wanted')     :
                     listing.listing_type}
                  </span>
                )}
                {listing.is_financing_eligible && (
                  <span className="badge-emerald text-xs">{isRTL ? 'مؤهل للتمويل' : 'Financing Eligible'}</span>
                )}
                {listing.is_ready_to_operate && (
                  <span className="badge-emerald text-xs">{isRTL ? 'جاهز للتشغيل' : 'Ready to Operate'}</span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-navy mb-2">{title}</h1>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {listing.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {listing.city}{listing.region ? `, ${listing.region}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye size={14} /> {listing.views_count ?? 0} {isRTL ? 'مشاهدة' : 'views'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {formatDistanceToNow(listing.created_at ?? '', locale)}
                </span>
              </div>
            </div>

            {/* Description */}
            {desc && (
              <div className="card">
                <h2 className="font-semibold text-navy mb-3">
                  {isRTL ? 'تفاصيل الإعلان' : 'Listing Details'}
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line" dir={isRTL ? 'rtl' : 'ltr'}>
                  {desc}
                </p>
              </div>
            )}

            {/* Dynamic data */}
            {listing.dynamic_data && Object.keys(listing.dynamic_data).length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-navy mb-3">
                  {isRTL ? 'المعلومات الإضافية' : 'Additional Information'}
                </h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {Object.entries(listing.dynamic_data).map(([key, val]) => (
                    <div key={key}>
                      <dt className="text-xs text-gray-400 uppercase tracking-wide">{key}</dt>
                      <dd className="text-sm font-medium text-gray-800">{String(val)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* ── Similar Listings ── */}
            {similar.length > 0 && (
              <div>
                <h2 className="font-bold text-navy text-base mb-4">
                  {isRTL ? '🔗 إعلانات مشابهة' : '🔗 Similar Listings'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similar.map(l => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: price + actions ── */}
          <div className="space-y-4">

            {/* Price card */}
            <div className="card border-2 border-emerald/20">
              {listing.price_type === 'on_request' ? (
                <p className="text-lg font-semibold text-gray-600">
                  {isRTL ? 'السعر عند الطلب' : 'Price on Request'}
                </p>
              ) : listing.price ? (
                <div>
                  <p className="text-xs text-gray-400 mb-1">{isRTL ? 'السعر' : 'Price'}</p>
                  <p className="text-3xl font-bold text-emerald">
                    {formatPrice(listing.price, locale)}
                  </p>
                  {listing.price_type === 'negotiable' && (
                    <p className="text-sm text-amber-600 mt-1 font-medium">
                      {isRTL ? '🤝 قابل للتفاوض' : '🤝 Negotiable'}
                    </p>
                  )}
                </div>
              ) : null}

              <div className="mt-4 space-y-2">
                {/* Message seller */}
                {isAuthenticated && user?.id !== listing.user_id ? (
                  <Link
                    href={`/${locale}/messages?to=${listing.user_id}&listing=${listing.id}`}
                    className="btn-primary w-full text-center flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    {isRTL ? 'مراسلة البائع' : 'Message Seller'}
                  </Link>
                ) : !isAuthenticated ? (
                  <Link href={`/${locale}/auth/login`} className="btn-primary w-full text-center">
                    {isRTL ? 'سجّل دخولك للتواصل' : 'Login to Contact'}
                  </Link>
                ) : null}

                {/* WhatsApp */}
                {listing.contact_phone && (
                  <button
                    onClick={handleWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                               bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition"
                  >
                    <MessageCircle size={16} />
                    {isRTL ? 'تواصل عبر واتساب' : 'Contact via WhatsApp'}
                  </button>
                )}

                {/* Phone display */}
                {listing.contact_phone && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-1">
                    <Phone size={14} />
                    <span dir="ltr">{listing.contact_phone}</span>
                  </div>
                )}

                {/* Bid */}
                {listing.section === 'ma' && (
                  <button
                    onClick={() => setShowBid(!showBid)}
                    className="btn-navy w-full flex items-center justify-center gap-2"
                  >
                    <DollarSign size={16} />
                    {isRTL ? 'تقديم عرض سعر' : 'Submit Bid'}
                  </button>
                )}

                {/* Bookmark */}
                <button
                  onClick={handleBookmark}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border
                              transition text-sm font-medium
                              ${bookmarked
                                ? 'border-emerald bg-emerald/10 text-emerald'
                                : 'border-gray-300 text-gray-600 hover:border-emerald'}`}
                >
                  <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                  {bookmarked
                    ? (isRTL ? 'محفوظ في المفضلة' : 'Bookmarked')
                    : (isRTL ? 'حفظ في المفضلة' : 'Save')}
                </button>
              </div>

              {/* Bid form */}
              {showBid && (
                <form onSubmit={handleBidSubmit} className="mt-4 space-y-3 border-t pt-4">
                  <input
                    type="number" value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="input text-sm"
                    placeholder={isRTL ? 'المبلغ (ر.س)' : 'Amount (SAR)'} required
                  />
                  <textarea
                    value={bidMsg} onChange={(e) => setBidMsg(e.target.value)}
                    className="input text-sm h-20 resize-none"
                    placeholder={isRTL ? 'رسالة مع عرضك (اختياري)' : 'Message with your bid (optional)'}
                  />
                  <button type="submit" disabled={submitting}
                    className="btn-primary w-full text-sm disabled:opacity-60">
                    {submitting ? (isRTL ? 'جارٍ الإرسال…' : 'Submitting…') : (isRTL ? 'إرسال العرض' : 'Send Bid')}
                  </button>
                </form>
              )}
            </div>

            {/* Seller card */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                {isRTL ? 'معلومات البائع' : 'Seller Info'}
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center
                                font-bold text-navy text-sm">
                  {sellerName?.[0] ?? '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{sellerName}</p>
                  <p className="text-xs text-gray-400 capitalize">{listing.user?.role}</p>
                </div>
                <div className="ms-auto flex gap-1">
                  {listing.user?.is_trusted_payer && (
                    <span title={isRTL ? 'دافع موثوق' : 'Trusted Payer'}>
                      <Shield className="text-emerald w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Report */}
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500
                         transition w-full justify-center py-1"
            >
              <Flag size={12} />
              {isRTL ? 'الإبلاغ عن الإعلان' : 'Report this listing'}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && imageUrls.length > 0 && (
        <Lightbox
          images={imageUrls}
          current={activeImg}
          onClose={() => setLightbox(false)}
          onChange={(i) => setActiveImg(i)}
        />
      )}

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          isRTL={isRTL}
          onClose={() => setShowReport(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
}
