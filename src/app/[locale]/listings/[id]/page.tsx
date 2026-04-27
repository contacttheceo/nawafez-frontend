'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  MapPin, Calendar, Eye, Star, Shield, Truck,
  DollarSign, Phone, MessageSquare, Bookmark, Flag, ArrowRight
} from 'lucide-react';
import { listingsApi, interactionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatPrice, formatDistanceToNow } from '@/lib/utils';
import type { Listing } from '@/types';
import toast from 'react-hot-toast';

const SECTION_LABELS: Record<string, { ar: string; en: string }> = {
  ma:        { ar: 'الاستحواذ والدمج', en: 'M&A'       },
  fleet:     { ar: 'الأسطول',          en: 'Fleet'     },
  contracts: { ar: 'العقود',            en: 'Contracts' },
  jobs:      { ar: 'الوظائف',          en: 'Jobs'      },
  forum:     { ar: 'المنتدى',          en: 'Forum'     },
};

export default function ListingDetailPage() {
  const { id }             = useParams<{ id: string }>();
  const locale             = useLocale();
  const router             = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [listing, setListing]   = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [showBid, setShowBid]    = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMsg, setBidMsg]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await listingsApi.getOne(Number(id));
        setListing(res.data ?? res);
        // Record view (fire-and-forget)
        listingsApi.recordView(Number(id)).catch(() => {});
      } catch {
        router.push(`/${locale}/listings`);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    try {
      if (bookmarked) {
        await interactionsApi.removeBookmark(Number(id));
        setBookmarked(false);
        toast.success(locale === 'ar' ? 'تمت إزالة الإعلان من المفضلة' : 'Removed from bookmarks');
      } else {
        await interactionsApi.bookmark(Number(id));
        setBookmarked(true);
        toast.success(locale === 'ar' ? 'تمت إضافة الإعلان للمفضلة' : 'Added to bookmarks');
      }
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ' : 'Something went wrong');
    }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    if (!bidAmount) return;

    setSubmitting(true);
    try {
      await interactionsApi.submitBid(Number(id), {
        amount: Number(bidAmount),
        message: bidMsg,
      });
      toast.success(locale === 'ar' ? 'تم تقديم عرض السعر بنجاح' : 'Bid submitted successfully');
      setShowBid(false);
      setBidAmount('');
      setBidMsg('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (locale === 'ar' ? 'حدث خطأ' : 'Error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    const reason = window.prompt(
      locale === 'ar' ? 'سبب الإبلاغ (spam, fraud, duplicate, inappropriate)' : 'Reason: spam, fraud, duplicate, inappropriate'
    );
    if (!reason) return;
    try {
      await interactionsApi.report(Number(id), { reason, details: '' });
      toast.success(locale === 'ar' ? 'تم الإبلاغ عن الإعلان' : 'Report submitted');
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ' : 'Error');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-6 w-2/3" />
          <div className="skeleton h-4 w-1/3" />
        </div>
      </main>
    );
  }

  if (!listing) return null;

  const title    = locale === 'ar' ? (listing.title_ar ?? listing.title_en) : (listing.title_en ?? listing.title_ar);
  const desc     = locale === 'ar' ? listing.description_ar : listing.description_en;
  const section  = SECTION_LABELS[listing.section] ?? { ar: listing.section, en: listing.section };
  const images   = listing.media?.filter((m) => m.type === 'image') ?? [];
  const sellerName = locale === 'ar'
    ? listing.user?.name_ar
    : listing.user?.name_en;

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href={`/${locale}`} className="hover:text-emerald">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
          <ArrowRight size={14} className={locale === 'ar' ? 'rotate-180' : ''} />
          <Link href={`/${locale}/listings`} className="hover:text-emerald">{locale === 'ar' ? 'الإعلانات' : 'Listings'}</Link>
          <ArrowRight size={14} className={locale === 'ar' ? 'rotate-180' : ''} />
          <span className="text-gray-700 truncate max-w-xs">{title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: images + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {images.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden aspect-video bg-gray-100">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${images[activeImg]?.path}`}
                    alt={title ?? ''}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${i === activeImg ? 'border-emerald' : 'border-transparent'}`}
                      >
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${img.path}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
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
                <span className="badge-navy text-xs">
                  {locale === 'ar' ? section.ar : section.en}
                </span>
                {listing.is_featured && (
                  <span className="badge-gold text-xs">
                    {locale === 'ar' ? '⭐ مميز' : '⭐ Featured'}
                  </span>
                )}
                {listing.is_financing_eligible && (
                  <span className="badge-emerald text-xs">
                    {locale === 'ar' ? 'مؤهل للتمويل' : 'Financing Eligible'}
                  </span>
                )}
                {listing.is_ready_to_operate && (
                  <span className="badge-emerald text-xs">
                    {locale === 'ar' ? 'جاهز للتشغيل' : 'Ready to Operate'}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-navy mb-2">{title}</h1>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {listing.city}{listing.region ? `, ${listing.region}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} /> {listing.views_count ?? 0} {locale === 'ar' ? 'مشاهدة' : 'views'}
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
                  {locale === 'ar' ? 'تفاصيل الإعلان' : 'Listing Details'}
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{desc}</p>
              </div>
            )}

            {/* Dynamic data */}
            {listing.dynamic_data && Object.keys(listing.dynamic_data).length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-navy mb-3">
                  {locale === 'ar' ? 'المعلومات الإضافية' : 'Additional Information'}
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
          </div>

          {/* Right column: price + actions */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="card border-2 border-emerald/20">
              {listing.price ? (
                <div>
                  <p className="text-xs text-gray-400 mb-1">{locale === 'ar' ? 'السعر' : 'Price'}</p>
                  <p className="text-3xl font-bold text-emerald">
                    {formatPrice(listing.price, locale)}
                  </p>
                  {listing.price_type && (
                    <p className="text-sm text-gray-500 mt-1">{listing.price_type}</p>
                  )}
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-600">
                  {locale === 'ar' ? 'السعر عند الطلب' : 'Price on Request'}
                </p>
              )}

              <div className="mt-4 space-y-2">
                {/* Message seller */}
                {isAuthenticated && user?.id !== listing.user_id ? (
                  <Link
                    href={`/${locale}/messages?to=${listing.user_id}&listing=${listing.id}`}
                    className="btn-primary w-full text-center flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    {locale === 'ar' ? 'مراسلة البائع' : 'Message Seller'}
                  </Link>
                ) : !isAuthenticated ? (
                  <Link href={`/${locale}/auth/login`} className="btn-primary w-full text-center">
                    {locale === 'ar' ? 'سجّل دخولك للتواصل' : 'Login to Contact'}
                  </Link>
                ) : null}

                {/* Submit bid */}
                {listing.section === 'ma' && (
                  <button
                    onClick={() => setShowBid(!showBid)}
                    className="btn-navy w-full flex items-center justify-center gap-2"
                  >
                    <DollarSign size={16} />
                    {locale === 'ar' ? 'تقديم عرض سعر' : 'Submit Bid'}
                  </button>
                )}

                {/* Bookmark */}
                <button
                  onClick={handleBookmark}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border transition text-sm font-medium
                    ${bookmarked ? 'border-emerald bg-emerald/10 text-emerald' : 'border-gray-300 text-gray-600 hover:border-emerald'}`}
                >
                  <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                  {bookmarked
                    ? (locale === 'ar' ? 'محفوظ في المفضلة' : 'Bookmarked')
                    : (locale === 'ar' ? 'حفظ في المفضلة' : 'Save')}
                </button>
              </div>

              {/* Bid form */}
              {showBid && (
                <form onSubmit={handleBidSubmit} className="mt-4 space-y-3 border-t pt-4">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="input text-sm"
                    placeholder={locale === 'ar' ? 'المبلغ (ر.س)' : 'Amount (SAR)'}
                    required
                  />
                  <textarea
                    value={bidMsg}
                    onChange={(e) => setBidMsg(e.target.value)}
                    className="input text-sm h-20 resize-none"
                    placeholder={locale === 'ar' ? 'رسالة مع عرضك (اختياري)' : 'Message with your bid (optional)'}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full text-sm disabled:opacity-60"
                  >
                    {submitting
                      ? (locale === 'ar' ? 'جارٍ الإرسال…' : 'Submitting…')
                      : (locale === 'ar' ? 'إرسال العرض' : 'Send Bid')}
                  </button>
                </form>
              )}
            </div>

            {/* Seller card */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                {locale === 'ar' ? 'معلومات البائع' : 'Seller Info'}
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center font-bold text-navy text-sm">
                  {sellerName?.[0] ?? '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{sellerName}</p>
                  <p className="text-xs text-gray-400 capitalize">{listing.user?.role}</p>
                </div>
                <div className="ms-auto flex gap-1">
                  {listing.user?.is_trusted_payer && (
                    <span title={locale === 'ar' ? 'دافع موثوق' : 'Trusted Payer'}>
                      <Shield className="text-emerald w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Report */}
            <button
              onClick={handleReport}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition w-full justify-center"
            >
              <Flag size={12} />
              {locale === 'ar' ? 'الإبلاغ عن الإعلان' : 'Report this listing'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
