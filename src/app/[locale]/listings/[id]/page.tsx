'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  MapPin, Calendar, Eye, Shield, Truck,
  DollarSign, Phone, MessageSquare, Bookmark, Flag,
  ArrowRight, MessageCircle, ChevronLeft, ChevronRight,
  Share2, Check, AlertTriangle, Clock, BadgeCheck,
  Send, Trash2, ChevronDown, Zap, Sparkles, X as XIcon,
} from 'lucide-react';
import { listingsApi, interactionsApi, commentsApi } from '@/lib/api';
import type { ListingComment } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatPrice, formatDistanceToNow, storageUrl } from '@/lib/utils';
import type { Listing } from '@/types';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Lightbox from '@/components/ui/Lightbox';
import ReportModal from '@/components/ui/ReportModal';
import { ListingCard } from '@/components/ui/ListingCard';

/* ── Static maps ─────────────────────────────────────────────────────────── */

const SECTION_META: Record<string, { ar: string; en: string; emoji: string; color: string }> = {
  ma:        { ar: 'الاستحواذ والدمج', en: 'M&A',       emoji: '🏢', color: 'bg-indigo-100 text-indigo-700'  },
  fleet:     { ar: 'الأسطول',          en: 'Fleet',     emoji: '🚛', color: 'bg-emerald-100 text-emerald-700' },
  contracts: { ar: 'العقود',            en: 'Contracts', emoji: '📄', color: 'bg-amber-100 text-amber-700'    },
  jobs:      { ar: 'الوظائف',          en: 'Jobs',      emoji: '💼', color: 'bg-purple-100 text-purple-700'  },
  forum:     { ar: 'المنتدى',          en: 'Forum',     emoji: '💬', color: 'bg-red-100 text-red-700'        },
};

const LISTING_TYPE_MAP: Record<string, { ar: string; en: string; color: string }> = {
  for_sale:    { ar: 'للبيع',    en: 'For Sale',   color: 'bg-blue-100 text-blue-700'    },
  for_rent:    { ar: 'للإيجار', en: 'For Rent',   color: 'bg-amber-100 text-amber-700'  },
  wanted:      { ar: 'مطلوب',   en: 'Wanted',     color: 'bg-purple-100 text-purple-700' },
  offering:    { ar: 'معروض',   en: 'Offering',   color: 'bg-green-100 text-green-700'  },
  job:         { ar: 'وظيفة',   en: 'Job',        color: 'bg-purple-100 text-purple-700' },
  discussion:  { ar: 'نقاش',    en: 'Discussion', color: 'bg-red-100 text-red-700'      },
  acquisition: { ar: 'استحواذ', en: 'Acquisition',color: 'bg-indigo-100 text-indigo-700'},
};

const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  vehicle_type:     { ar: 'نوع المركبة',       en: 'Vehicle Type'      },
  condition:        { ar: 'الحالة',             en: 'Condition'         },
  year:             { ar: 'سنة الصنع',          en: 'Year'              },
  mileage:          { ar: 'عداد الكيلومترات',   en: 'Mileage (km)'      },
  capacity:         { ar: 'الحمولة',            en: 'Capacity'          },
  contract_type:    { ar: 'نوع العقد',          en: 'Contract Type'     },
  duration:         { ar: 'مدة العقد',          en: 'Duration'          },
  employment_type:  { ar: 'نوع التوظيف',        en: 'Employment Type'   },
  experience_years: { ar: 'سنوات الخبرة',       en: 'Experience'        },
  salary_type:      { ar: 'نوع الراتب',         en: 'Salary Type'       },
  salary_min:       { ar: 'الراتب الأدنى',      en: 'Min Salary'        },
  salary_max:       { ar: 'الراتب الأقصى',      en: 'Max Salary'        },
  company_type:     { ar: 'نوع الشركة',         en: 'Company Type'      },
  employees_count:  { ar: 'عدد الموظفين',       en: 'Employees'         },
  annual_revenue:   { ar: 'الإيرادات السنوية',  en: 'Annual Revenue'    },
  job_title:        { ar: 'المسمى الوظيفي',     en: 'Job Title'         },
};

/* ── Component ──────────────────────────────────────────────────────────────  */

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
  const [copied,     setCopied]     = useState(false);

  // Bids state
  const [bidCount,   setBidCount]   = useState<number>(0);
  const [highestBid, setHighestBid] = useState<number | null>(null);
  const [ownerBids,  setOwnerBids]  = useState<Array<{ amount: number; message: string | null; submitted_at: string }>>([]);

  // Comments state
  const [comments,          setComments]          = useState<ListingComment[]>([]);
  const [commentMeta,       setCommentMeta]       = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [commentPage,       setCommentPage]       = useState(1);
  const [commentText,       setCommentText]       = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentLoading,    setCommentLoading]    = useState(true);
  const [loadingMoreCom,    setLoadingMoreCom]    = useState(false);
  const [commentSummary,    setCommentSummary]    = useState<string[]>([]);
  const [summaryDismissed,  setSummaryDismissed]  = useState(false);
  const summaryFetchedRef = useRef(false); // prevent duplicate fetches


  /* ── Load listing ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await listingsApi.getOne(Number(id));
        const data = res.data ?? res;
        setListing(data);
        listingsApi.recordView(Number(id)).catch(() => {});

        if (data.section) {
          listingsApi.getAll({ section: data.section, city: data.city, limit: 5, page: 1 })
            .then((r: any) => {
              const all: Listing[] = r.data ?? r;
              setSimilar(all.filter((l: Listing) => l.id !== data.id).slice(0, 4));
            })
            .catch(() => {});
        }

        // Fetch bid summary (M&A only)
        if (data.section === 'ma') {
          interactionsApi.getBids(Number(id))
            .then((res: any) => {
              setBidCount(res.bid_count ?? 0);
              setHighestBid(res.highest_bid ?? null);
              setOwnerBids(res.bids ?? []);
            })
            .catch(() => {});
        }
      } catch {
        router.push(`/${locale}/listings`);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Load comments ── */
  const fetchComments = useCallback(async (page: number, append = false) => {
    if (page === 1) setCommentLoading(true); else setLoadingMoreCom(true);
    try {
      const res = await commentsApi.getAll(Number(id), page);
      const incoming: ListingComment[] = res.data;
      setComments(prev => append ? [...prev, ...incoming] : incoming);
      setCommentMeta(res.meta);
      // Trigger summary for ≥5 comments — done via useEffect below
    } catch {}
    finally { setCommentLoading(false); setLoadingMoreCom(false); }
  }, [id]);

  useEffect(() => { fetchComments(1); }, [fetchComments]);

  /* ── Auto-summarize when ≥5 comments are loaded ── */
  useEffect(() => {
    if (summaryFetchedRef.current) return;   // already fetched
    if (commentLoading)            return;   // still loading
    if (comments.length < 5)       return;   // not enough (uses actual array, not meta)
    if (!listing)                  return;   // listing not ready

    summaryFetchedRef.current = true;
    const texts = comments.map(c => c.body);
    fetch('/api/ai/summarize-comments', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        comments:      texts,
        listing_title: listing.title_ar ?? '',
        section:       listing.section  ?? '',
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.points?.length) setCommentSummary(data.points); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length, commentLoading, listing?.id]);

  /* ── Add comment ── */
  const handleAddComment = async () => {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await commentsApi.add(Number(id), commentText.trim());
      setComments(prev => [res.data, ...prev]);
      setCommentMeta(prev => prev ? { ...prev, total: prev.total + 1 } : prev);
      setCommentText('');
      toast.success(isRTL ? 'تم إضافة التعليق ✓' : 'Comment added ✓');
    } catch (err: any) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 422 && message) {
        toast.error(message);
      } else if (status === 404) {
        toast.error(isRTL ? 'المسار غير موجود (404) — تحقق من رفع routes/api.php' : 'Route not found (404)');
      } else if (status === 500) {
        toast.error(isRTL ? `خطأ في السيرفر (500)${message ? ': ' + message : ''}` : `Server error (500)${message ? ': ' + message : ''}`);
      } else {
        toast.error(isRTL ? `فشل إضافة التعليق (${status ?? 'network'})` : `Failed to add comment (${status ?? 'network'})`);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  /* ── Delete comment ── */
  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentsApi.delete(Number(id), commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentMeta(prev => prev ? { ...prev, total: prev.total - 1 } : prev);
      toast.success(isRTL ? 'تم حذف التعليق' : 'Comment deleted');
    } catch {
      toast.error(isRTL ? 'فشل الحذف' : 'Delete failed');
    }
  };

  /* ── Keyboard navigation for gallery ── */
  useEffect(() => {
    if (lightbox || !listing) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setActiveImg(i => (i - 1 + imageUrls.length) % imageUrls.length);
      if (e.key === 'ArrowRight') setActiveImg(i => (i + 1) % imageUrls.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, listing]);

  /* ── Bookmark ── */
  const handleBookmark = async () => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    try {
      if (bookmarked) {
        await interactionsApi.removeBookmark(Number(id));
        setBookmarked(false);
        toast.success(isRTL ? 'تمت الإزالة من المفضلة' : 'Removed from bookmarks');
      } else {
        await interactionsApi.bookmark(Number(id));
        setBookmarked(true);
        toast.success(isRTL ? '✓ تمت الإضافة للمفضلة' : '✓ Added to bookmarks');
      }
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Something went wrong');
    }
  };

  /* ── Share ── */
  const handleShare = async () => {
    const url = window.location.href;
    const title = isRTL ? listing?.title_ar : listing?.title_en;
    try {
      if (navigator.share) {
        await navigator.share({ title: title ?? '', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(isRTL ? 'تم نسخ الرابط ✓' : 'Link copied ✓');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
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
      toast.success(isRTL ? 'تم تقديم عرض السعر بنجاح ✓' : 'Bid submitted ✓');
      setShowBid(false); setBidAmount(''); setBidMsg('');
      // Refresh bid summary after submission
      interactionsApi.getBids(Number(id))
        .then((res: any) => {
          setBidCount(res.bid_count ?? 0);
          setHighestBid(res.highest_bid ?? null);
          setOwnerBids(res.bids ?? []);
        }).catch(() => {});
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
  const handleWhatsApp = useCallback(() => {
    if (!listing?.contact_phone) return;
    const title = isRTL ? listing.title_ar : (listing.title_en ?? listing.title_ar);
    const text  = encodeURIComponent(
      isRTL
        ? `مرحباً، رأيت إعلانك "${title}" على نوافذ وأود الاستفسار.`
        : `Hi, I saw your listing "${title}" on Nawafez and I'm interested.`
    );
    window.open(`https://wa.me/${listing.contact_phone.replace(/\D/g, '')}?text=${text}`, '_blank');
  }, [listing, isRTL]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4 animate-pulse">
              <div className="h-72 bg-gray-200 rounded-2xl" />
              <div className="h-6 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-32 bg-gray-200 rounded-xl" />
            </div>
            <div className="space-y-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-2xl" />
              <div className="h-28 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const title       = isRTL ? (listing.title_ar ?? listing.title_en) : (listing.title_en ?? listing.title_ar);
  const desc        = isRTL ? listing.description_ar : (listing.description_en ?? listing.description_ar);
  const sellerName  = isRTL ? listing.user?.name_ar : listing.user?.name_en;
  const sectionMeta = SECTION_META[listing.section] ?? { ar: listing.section, en: listing.section, emoji: '📋', color: 'bg-gray-100 text-gray-700' };
  const typeMeta    = listing.listing_type ? LISTING_TYPE_MAP[listing.listing_type] : null;
  const isOwner     = isAuthenticated && user?.id === listing.user_id;
  const canContact  = !isOwner && (listing.contact_phone || !isOwner);

  /* Build image URLs */
  const rawImages = listing.media?.filter((m: any) => m.type === 'image') ?? [];
  const imageUrls = rawImages.length > 0
    ? rawImages.map((img: any) => `${process.env.NEXT_PUBLIC_API_URL}/uploads/${img.path}`)
    : (listing.images ?? []);

  /* Dynamic data entries */
  const dynEntries = listing.dynamic_data ? Object.entries(listing.dynamic_data).filter(([, v]) => v !== null && v !== '' && v !== undefined) : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-24 lg:pb-10">

          {/* Status Banner — for non-active listings */}
          {listing.status === 'pending_review' && (
            <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200
                            rounded-xl px-4 py-3 text-amber-700 text-sm font-medium">
              <Clock size={16} className="shrink-0" />
              {isRTL
                ? 'هذا الإعلان قيد المراجعة من قِبل الفريق وسيُنشر قريباً.'
                : 'This listing is pending review by our team and will be published soon.'}
            </div>
          )}
          {listing.status === 'rejected' && (
            <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200
                            rounded-xl px-4 py-3 text-red-700 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{isRTL ? 'تم رفض هذا الإعلان' : 'This listing was rejected'}</p>
                {listing.rejection_reason && (
                  <p className="text-xs mt-0.5 text-red-600">{listing.rejection_reason}</p>
                )}
              </div>
            </div>
          )}

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 flex-wrap">
            <Link href={`/${locale}`} className="hover:text-emerald transition-colors">
              {isRTL ? 'الرئيسية' : 'Home'}
            </Link>
            <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
            <Link href={`/${locale}/listings`} className="hover:text-emerald transition-colors">
              {isRTL ? 'الإعلانات' : 'Listings'}
            </Link>
            <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
            <Link href={`/${locale}/listings?section=${listing.section}`}
                  className="hover:text-emerald transition-colors">
              {isRTL ? sectionMeta.ar : sectionMeta.en}
            </Link>
            <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
            <span className="text-gray-600 truncate max-w-[180px]">{title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* ── LEFT: images + details ─────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Image Gallery */}
              {imageUrls.length > 0 ? (
                <div className="space-y-3">
                  {/* Main image */}
                  <div
                    className="relative rounded-2xl overflow-hidden aspect-video bg-gray-100
                               cursor-zoom-in group shadow-sm"
                    onClick={() => setLightbox(true)}
                  >
                    <img
                      src={imageUrls[activeImg]}
                      alt={`${title} — ${isRTL ? 'صورة' : 'image'} ${activeImg + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300
                                 group-hover:scale-[1.02]"
                    />

                    {/* Overlay hint */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15
                                    transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity
                                       bg-black/60 text-white text-xs px-3 py-1.5 rounded-full
                                       backdrop-blur-sm">
                        {isRTL ? '🔍 انقر للتكبير' : '🔍 Click to zoom'}
                      </span>
                    </div>

                    {/* Prev / Next arrows */}
                    {imageUrls.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveImg(i => (i - 1 + imageUrls.length) % imageUrls.length); }}
                          className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                                     bg-black/40 hover:bg-black/60 text-white flex items-center
                                     justify-center transition opacity-0 group-hover:opacity-100 z-10"
                          aria-label={isRTL ? 'السابق' : 'Previous'}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveImg(i => (i + 1) % imageUrls.length); }}
                          className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                                     bg-black/40 hover:bg-black/60 text-white flex items-center
                                     justify-center transition opacity-0 group-hover:opacity-100 z-10"
                          aria-label={isRTL ? 'التالي' : 'Next'}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}

                    {/* Counter */}
                    {imageUrls.length > 1 && (
                      <span className="absolute bottom-3 end-3 bg-black/50 text-white
                                       text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {activeImg + 1} / {imageUrls.length}
                      </span>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {imageUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {imageUrls.map((url: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(i)}
                          className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all
                                      ${i === activeImg
                                        ? 'border-emerald ring-2 ring-emerald/20'
                                        : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400'}`}
                          aria-label={`${isRTL ? 'صورة' : 'Image'} ${i + 1}`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl aspect-video bg-gradient-to-br from-navy/5 to-emerald/10
                               flex items-center justify-center">
                  <span className="text-7xl opacity-40">{sectionMeta.emoji}</span>
                </div>
              )}

              {/* Title + Badges + Meta */}
              <div className="space-y-3">
                {/* Badges row */}
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sectionMeta.color}`}>
                    {sectionMeta.emoji} {isRTL ? sectionMeta.ar : sectionMeta.en}
                  </span>
                  {typeMeta && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeMeta.color}`}>
                      {isRTL ? typeMeta.ar : typeMeta.en}
                    </span>
                  )}
                  {listing.is_featured && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      ⭐ {isRTL ? 'مميز' : 'Featured'}
                    </span>
                  )}
                  {listing.is_financing_eligible && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                      💰 {isRTL ? 'مؤهل للتمويل' : 'Financing OK'}
                    </span>
                  )}
                  {listing.is_ready_to_operate && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      🟢 {isRTL ? 'جاهز للتشغيل' : 'Ready to Operate'}
                    </span>
                  )}
                </div>

                {/* Title + share */}
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl font-black text-navy leading-snug flex-1">{title}</h1>
                  <button
                    onClick={handleShare}
                    title={isRTL ? 'مشاركة' : 'Share'}
                    className="shrink-0 p-2 rounded-xl border border-gray-200 hover:border-emerald
                               text-gray-500 hover:text-emerald transition-colors mt-0.5"
                  >
                    {copied ? <Check size={18} className="text-emerald" /> : <Share2 size={18} />}
                  </button>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {listing.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-emerald" />
                      {listing.city}{listing.region ? `، ${listing.region}` : ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Eye size={14} className="text-gray-400" />
                    {(listing.views_count ?? 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                    {' '}{isRTL ? 'مشاهدة' : 'views'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDistanceToNow(listing.created_at ?? '', locale)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {desc && (
                <div className="card p-5">
                  <h2 className="font-bold text-navy mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald rounded-full inline-block" />
                    {isRTL ? 'تفاصيل الإعلان' : 'Listing Details'}
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm"
                     dir={isRTL ? 'rtl' : 'ltr'}>
                    {desc}
                  </p>
                </div>
              )}

              {/* Dynamic data — with human-readable labels */}
              {dynEntries.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald rounded-full inline-block" />
                    {isRTL ? 'معلومات إضافية' : 'Additional Info'}
                  </h2>
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {dynEntries.map(([key, val]) => {
                      const label = FIELD_LABELS[key];
                      return (
                        <div key={key} className="bg-gray-50 rounded-xl px-3 py-2.5">
                          <dt className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                            {label ? (isRTL ? label.ar : label.en) : key}
                          </dt>
                          <dd className="text-sm font-semibold text-gray-800">{String(val)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              )}

              {/* ── AI Contract Analyzer teaser (contracts section only) ── */}
              {listing.section === 'contracts' && (
                <Link
                  href={`/${locale}/tools/contract-analyzer`}
                  className="card flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600
                                  flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy text-sm">
                      {isRTL ? '🤖 محلل العقود بالذكاء الاصطناعي' : '🤖 AI Contract Analyzer'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isRTL
                        ? 'استلمت عقداً من هذه الشركة؟ حلّله قبل التوقيع في ثوانٍ'
                        : 'Received a contract from this company? Analyze it before signing'}
                    </p>
                  </div>
                  {isRTL
                    ? <ChevronLeft size={16} className="text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
                    : <ChevronRight size={16} className="text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
                  }
                </Link>
              )}

              {/* ── Comments ─────────────────────────────────────── */}
              <div>
                <h2 className="font-bold text-navy text-lg mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald rounded-full inline-block" />
                  {isRTL ? 'التعليقات' : 'Comments'}
                  {commentMeta && commentMeta.total > 0 && (
                    <span className="text-sm font-normal text-gray-400 ms-1">
                      ({commentMeta.total})
                    </span>
                  )}
                </h2>

                {/* AI Comment Summary Card */}
                {commentSummary.length > 0 && !summaryDismissed && (
                  <div className="mb-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-violet-500 flex items-center justify-center">
                          <Sparkles size={12} className="text-white" />
                        </div>
                        <p className="text-xs font-bold text-violet-700">
                          {isRTL ? '🤖 أبرز ما يسأل عنه الناس' : '🤖 What people ask about'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSummaryDismissed(true)}
                        className="p-0.5 text-violet-300 hover:text-violet-600 transition">
                        <XIcon size={14} />
                      </button>
                    </div>
                    <ul className="space-y-1.5">
                      {commentSummary.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-violet-800">
                          <span className="text-violet-400 font-bold shrink-0 mt-px">·</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Add comment form */}
                {isAuthenticated ? (
                  <div className="flex gap-3 mb-5">
                    <div className="w-9 h-9 rounded-full bg-emerald/20 border border-emerald/30
                                    flex items-center justify-center text-emerald font-bold text-sm shrink-0">
                      {(isRTL ? user?.name_ar : user?.name_en)?.[0]?.toUpperCase() ?? 'أ'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment();
                        }}
                        rows={3}
                        maxLength={1000}
                        className="input w-full text-sm resize-none"
                        placeholder={isRTL
                          ? 'اكتب تعليقك هنا… (Ctrl+Enter للإرسال)'
                          : 'Write your comment… (Ctrl+Enter to send)'}
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-gray-300">{commentText.length}/1000</span>
                        <button
                          onClick={handleAddComment}
                          disabled={submittingComment || !commentText.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald hover:bg-emerald-dark
                                     text-white text-xs font-bold rounded-lg transition disabled:opacity-40"
                        >
                          {submittingComment
                            ? <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                            : <Send size={13} />}
                          {isRTL ? 'إرسال' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 text-center mb-5">
                    <p className="text-sm text-gray-400 mb-2">
                      {isRTL ? 'سجّل دخولك لإضافة تعليق' : 'Sign in to leave a comment'}
                    </p>
                    <a href={`/${locale}/auth/login`}
                      className="inline-block text-xs font-bold text-emerald hover:underline">
                      {isRTL ? 'تسجيل الدخول ←' : '→ Sign In'}
                    </a>
                  </div>
                )}

                {/* Comments list */}
                {commentLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                        <div className="flex-1 space-y-2 pt-1">
                          <div className="h-3 bg-gray-200 rounded w-32" />
                          <div className="h-3 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 text-gray-300 text-sm">
                    {isRTL ? 'لا توجد تعليقات بعد — كن أول من يعلّق' : 'No comments yet — be the first!'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map(c => {
                      const name = isRTL ? (c.user?.name_ar ?? c.user?.name_en) : (c.user?.name_en ?? c.user?.name_ar);
                      const canDelete = user?.id === c.user_id || user?.id === listing?.user_id || user?.role === 'admin';
                      return (
                        <div key={c.id} className="flex gap-3 group">
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-navy/10 border border-navy/10
                                          flex items-center justify-center text-navy font-bold text-sm shrink-0 overflow-hidden">
                            {c.user?.avatar_url && storageUrl(c.user.avatar_url)
                              ? <img src={storageUrl(c.user.avatar_url)!}
                                     alt="" className="w-full h-full object-cover"
                                     onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              : (name?.[0]?.toUpperCase() ?? '؟')
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm text-navy">{name ?? '—'}</span>
                              {c.user?.is_trusted_payer && (
                                <span className="text-[10px] bg-emerald/10 text-emerald font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <BadgeCheck size={10} /> {isRTL ? 'موثّق' : 'Verified'}
                                </span>
                              )}
                              <span className="text-xs text-gray-400 ms-auto">
                                {formatDistanceToNow(c.created_at, locale)}
                              </span>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-300
                                             hover:text-red-400 transition p-1 rounded"
                                  title={isRTL ? 'حذف' : 'Delete'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                              {c.body}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Load more */}
                    {commentMeta && commentPage < commentMeta.last_page && (
                      <button
                        onClick={() => {
                          const next = commentPage + 1;
                          setCommentPage(next);
                          fetchComments(next, true);
                        }}
                        disabled={loadingMoreCom}
                        className="w-full py-2.5 text-sm text-emerald border border-emerald/30
                                   hover:bg-emerald/5 rounded-xl transition font-medium flex items-center
                                   justify-center gap-2 disabled:opacity-40"
                      >
                        {loadingMoreCom
                          ? <span className="animate-spin w-3.5 h-3.5 border border-emerald border-t-transparent rounded-full" />
                          : <ChevronDown size={15} />}
                        {isRTL ? 'تحميل المزيد' : 'Load more'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Similar Listings */}
              {similar.length > 0 && (
                <div>
                  <h2 className="font-bold text-navy text-lg mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald rounded-full inline-block" />
                    {isRTL ? 'إعلانات مشابهة' : 'Similar Listings'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {similar.map(l => <ListingCard key={l.id} listing={l} />)}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: sticky sidebar ──────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">

                {/* Price card */}
                <div className="card p-5 border-2 border-emerald/20">

                  {/* Price */}
                  {listing.price_type === 'on_request' ? (
                    <p className="text-base font-semibold text-gray-500 mb-4">
                      {isRTL ? '💬 السعر عند الطلب' : '💬 Price on Request'}
                    </p>
                  ) : listing.price ? (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-0.5">{isRTL ? 'السعر' : 'Price'}</p>
                      <p className="text-3xl font-black text-emerald leading-none">
                        {formatPrice(listing.price, locale)}
                      </p>
                      {listing.price_type === 'negotiable' && (
                        <p className="text-xs text-amber-600 mt-1 font-medium">
                          🤝 {isRTL ? 'قابل للتفاوض' : 'Negotiable'}
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="space-y-2.5">

                    {/* WhatsApp — primary CTA if phone exists */}
                    {listing.contact_phone && (
                      <button
                        onClick={handleWhatsApp}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                                   bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm
                                   transition-colors shadow-sm shadow-green-200"
                      >
                        <MessageCircle size={17} />
                        {isRTL ? 'تواصل عبر واتساب' : 'WhatsApp'}
                      </button>
                    )}

                    {/* Message seller */}
                    {isAuthenticated && !isOwner ? (
                      <Link
                        href={`/${locale}/messages?to=${listing.user_id}&listing=${listing.id}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                                   rounded-xl bg-navy hover:bg-navy-dark text-white font-semibold
                                   text-sm transition-colors"
                      >
                        <MessageSquare size={16} />
                        {isRTL ? 'مراسلة البائع' : 'Message Seller'}
                      </Link>
                    ) : !isAuthenticated ? (
                      <Link
                        href={`/${locale}/auth/login`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                                   rounded-xl bg-navy hover:bg-navy-dark text-white font-semibold
                                   text-sm transition-colors"
                      >
                        {isRTL ? 'سجّل دخولك للتواصل' : 'Login to Contact'}
                      </Link>
                    ) : null}

                    {/* Phone number */}
                    {listing.contact_phone && (
                      <a
                        href={`tel:${listing.contact_phone}`}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm
                                   text-gray-500 hover:text-navy transition-colors"
                        dir="ltr"
                      >
                        <Phone size={14} />
                        {listing.contact_phone}
                      </a>
                    )}

                    {/* Bid — M&A only, not for owner */}
                    {listing.section === 'ma' && !isOwner && (
                      <button
                        onClick={() => setShowBid(!showBid)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                                   rounded-xl border-2 border-navy text-navy hover:bg-navy
                                   hover:text-white font-semibold text-sm transition-colors"
                      >
                        <DollarSign size={16} />
                        {isRTL ? 'تقديم عرض سعر' : 'Submit Bid'}
                      </button>
                    )}

                    {/* Bid form */}
                    {showBid && (
                      <form onSubmit={handleBidSubmit}
                            className="space-y-2 border-t border-gray-100 pt-3 mt-1">
                        <input
                          type="number" value={bidAmount} min={1}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="input text-sm"
                          placeholder={isRTL ? 'المبلغ بالريال' : 'Amount (SAR)'}
                          required
                        />
                        <textarea
                          value={bidMsg} onChange={(e) => setBidMsg(e.target.value)}
                          className="input text-sm h-20 resize-none"
                          placeholder={isRTL ? 'رسالة مع عرضك (اختياري)' : 'Message (optional)'}
                        />
                        <button type="submit" disabled={submitting}
                          className="btn-primary w-full text-sm disabled:opacity-60">
                          {submitting ? '…' : (isRTL ? 'إرسال العرض' : 'Send Bid')}
                        </button>
                      </form>
                    )}

                    {/* Bid summary — M&A public info */}
                    {listing.section === 'ma' && bidCount > 0 && (
                      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 space-y-1.5">
                        <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                          <DollarSign size={13} />
                          {isRTL ? 'إحصائيات العروض' : 'Bid Statistics'}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{isRTL ? 'عدد العروض' : 'Total Bids'}</span>
                          <span className="text-sm font-black text-indigo-700">{bidCount}</span>
                        </div>
                        {highestBid != null && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">{isRTL ? 'أعلى عرض' : 'Highest Bid'}</span>
                            <span className="text-sm font-black text-emerald">
                              {highestBid.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} {isRTL ? 'ر.س' : 'SAR'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Owner: full bids list */}
                    {isOwner && ownerBids.length > 0 && (
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <p className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-1.5">
                          <DollarSign size={12} className="text-indigo-500" />
                          {isRTL ? 'تفاصيل العروض المقدمة' : 'Received Bids'}
                        </p>
                        <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                          {ownerBids.map((bid, i) => (
                            <div key={i} className="px-3 py-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-navy">
                                  {bid.amount.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} {isRTL ? 'ر.س' : 'SAR'}
                                </span>
                                {i === 0 && (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                    {isRTL ? '⭐ الأعلى' : '⭐ Highest'}
                                  </span>
                                )}
                              </div>
                              {bid.message && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{bid.message}</p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(bid.submitted_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bookmark */}
                    <button
                      onClick={handleBookmark}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4
                                  rounded-xl border-2 text-sm font-medium transition-colors
                                  ${bookmarked
                                    ? 'border-emerald bg-emerald/5 text-emerald'
                                    : 'border-gray-200 text-gray-500 hover:border-emerald hover:text-emerald'}`}
                    >
                      <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                      {bookmarked
                        ? (isRTL ? 'محفوظ في المفضلة' : 'Saved')
                        : (isRTL ? 'حفظ في المفضلة' : 'Save')}
                    </button>
                  </div>
                </div>

                {/* Seller card */}
                <div className="card p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    {isRTL ? 'معلومات المُعلِن' : 'Posted By'}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-navy/10 flex items-center justify-center
                                    font-black text-navy text-base shrink-0">
                      {sellerName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{sellerName}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {listing.user?.role === 'business'
                          ? (isRTL ? 'شركة' : 'Business')
                          : (isRTL ? 'فرد' : 'Individual')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {listing.user?.role === 'business' && (
                        <span title={isRTL ? 'حساب موثق' : 'Verified Business'}
                              className="flex items-center gap-1 text-[10px] text-emerald font-semibold
                                         bg-emerald/10 px-2 py-0.5 rounded-full">
                          <BadgeCheck size={11} /> {isRTL ? 'موثق' : 'Verified'}
                        </span>
                      )}
                      {listing.user?.is_trusted_payer && (
                        <span title={isRTL ? 'دافع موثوق' : 'Trusted Payer'}
                              className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold
                                         bg-amber-50 px-2 py-0.5 rounded-full">
                          <Shield size={11} /> {isRTL ? 'موثوق' : 'Trusted'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Report */}
                <button
                  onClick={() => setShowReport(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs
                             text-gray-400 hover:text-red-500 transition-colors py-1"
                >
                  <Flag size={12} />
                  {isRTL ? 'الإبلاغ عن هذا الإعلان' : 'Report this listing'}
                </button>

              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* ── Mobile floating CTA bar ─────────────────────────────────────── */}
      {canContact && (
        <div className="fixed bottom-0 inset-x-0 lg:hidden z-40 bg-white border-t
                        border-gray-200 px-4 py-3 flex gap-3 shadow-lg">
          {listing.contact_phone ? (
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-[#25D366] text-white font-bold text-sm"
            >
              <MessageCircle size={17} />
              {isRTL ? 'واتساب' : 'WhatsApp'}
            </button>
          ) : null}
          {isAuthenticated && !isOwner ? (
            <Link
              href={`/${locale}/messages?to=${listing.user_id}&listing=${listing.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-navy text-white font-bold text-sm"
            >
              <MessageSquare size={16} />
              {isRTL ? 'مراسلة' : 'Message'}
            </Link>
          ) : !isAuthenticated ? (
            <Link
              href={`/${locale}/auth/login`}
              className="flex-1 flex items-center justify-center py-3 rounded-xl
                         bg-navy text-white font-bold text-sm"
            >
              {isRTL ? 'تواصل' : 'Contact'}
            </Link>
          ) : null}
          <button
            onClick={handleBookmark}
            className={`w-12 flex items-center justify-center rounded-xl border-2 transition
                        ${bookmarked ? 'border-emerald bg-emerald/10 text-emerald' : 'border-gray-200 text-gray-500'}`}
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && imageUrls.length > 0 && (
        <Lightbox
          images={imageUrls}
          current={activeImg}
          onClose={() => setLightbox(false)}
          onChange={setActiveImg}
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
