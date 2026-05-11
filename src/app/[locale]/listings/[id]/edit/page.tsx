'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowRight, Save, Loader2, ImagePlus, X, AlertTriangle, Info, Sparkles,
} from 'lucide-react';
import { listingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';

/* ── Section meta ───────────────────────────────────────────────────────── */
const SECTIONS = [
  { key: 'ma',        arLabel: 'الاستحواذ والدمج', enLabel: 'M&A',        emoji: '🏢' },
  { key: 'fleet',     arLabel: 'الأسطول',           enLabel: 'Fleet',      emoji: '🚛' },
  { key: 'contracts', arLabel: 'العقود',             enLabel: 'Contracts',  emoji: '📄' },
  { key: 'jobs',      arLabel: 'الوظائف',           enLabel: 'Jobs',       emoji: '💼' },
  { key: 'forum',     arLabel: 'المنتدى',            enLabel: 'Forum',      emoji: '💬' },
];

const LISTING_TYPES: Record<string, Array<{ value: string; arLabel: string; enLabel: string }>> = {
  fleet:     [
    { value: 'for_sale', arLabel: 'للبيع',    enLabel: 'For Sale'  },
    { value: 'for_rent', arLabel: 'للإيجار', enLabel: 'For Rent'  },
    { value: 'wanted',   arLabel: 'مطلوب',   enLabel: 'Wanted'    },
  ],
  contracts: [
    { value: 'offering', arLabel: 'معروض',   enLabel: 'Offering'  },
    { value: 'wanted',   arLabel: 'مطلوب',   enLabel: 'Wanted'    },
  ],
};

const DYNAMIC_FIELDS: Record<string, Array<{ key: string; arLabel: string; enLabel: string; type: 'text' | 'number' | 'select'; options?: string[] }>> = {
  fleet: [
    { key: 'vehicle_type', arLabel: 'نوع المركبة',     enLabel: 'Vehicle Type',   type: 'select', options: ['شاحنة', 'نصف نقل', 'مقطورة', 'رافعة', 'صهريج', 'أخرى'] },
    { key: 'condition',    arLabel: 'الحالة',           enLabel: 'Condition',      type: 'select', options: ['جديد', 'مستعمل'] },
    { key: 'year',         arLabel: 'سنة الصنع',        enLabel: 'Year',           type: 'number' },
    { key: 'mileage',      arLabel: 'الكيلومترات',      enLabel: 'Mileage (km)',   type: 'number' },
    { key: 'capacity',     arLabel: 'الحمولة (طن)',     enLabel: 'Capacity (ton)', type: 'text'   },
  ],
  contracts: [
    { key: 'contract_type', arLabel: 'نوع العقد', enLabel: 'Contract Type', type: 'select', options: ['توزيع', 'نقل', 'مستودعات', 'خدمات', 'أخرى'] },
    { key: 'duration',      arLabel: 'مدة العقد', enLabel: 'Duration',      type: 'text'   },
  ],
  jobs: [
    { key: 'job_title',        arLabel: 'المسمى الوظيفي', enLabel: 'Job Title',        type: 'text'   },
    { key: 'employment_type',  arLabel: 'نوع التوظيف',    enLabel: 'Employment Type',   type: 'select', options: ['دوام كامل', 'جزئي', 'عقد مؤقت'] },
    { key: 'experience_years', arLabel: 'سنوات الخبرة',   enLabel: 'Experience Years',  type: 'select', options: ['لا يشترط', '1-3', '3-5', '+5'] },
  ],
  ma: [
    { key: 'company_type',    arLabel: 'نوع الشركة',       enLabel: 'Company Type',       type: 'select', options: ['شركة نقل', 'مستودعات', 'تقنية لوجستية', 'أخرى'] },
    { key: 'employees_count', arLabel: 'عدد الموظفين',     enLabel: 'Employee Count',     type: 'select', options: ['1-10', '10-50', '50-200', '+200'] },
    { key: 'annual_revenue',  arLabel: 'الإيرادات السنوية', enLabel: 'Annual Revenue',    type: 'text'   },
  ],
};

const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر', 'تبوك', 'أبها', 'القصيم', 'حائل'];

/* ── Component ──────────────────────────────────────────────────────────── */
export default function EditListingPage() {
  const { id }                    = useParams<{ id: string }>();
  const locale                    = useLocale();
  const router                    = useRouter();
  const isRTL                     = locale === 'ar';
  const { user, isAuthenticated } = useAuthStore();
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [listing,     setListing]     = useState<any>(null);

  /* ── Form state ── */
  const [section,       setSection]       = useState('');
  const [listingType,   setListingType]   = useState('');
  const [titleAr,       setTitleAr]       = useState('');
  const [titleEn,       setTitleEn]       = useState('');
  const [descAr,        setDescAr]        = useState('');
  const [city,          setCity]          = useState('');
  const [region,        setRegion]        = useState('');
  const [price,         setPrice]         = useState('');
  const [priceType,     setPriceType]     = useState('fixed');
  const [contactPhone,  setContactPhone]  = useState('');
  const [dynData,       setDynData]       = useState<Record<string, string>>({});

  const [aiWriting, setAiWriting] = useState(false);

  /* ── Image state ── */
  const [existingImgs,  setExistingImgs]  = useState<string[]>([]);   // current paths from backend
  const [removedPaths,  setRemovedPaths]  = useState<string[]>([]);   // paths to remove
  const [newFiles,      setNewFiles]      = useState<File[]>([]);      // new files to upload
  const [newPreviews,   setNewPreviews]   = useState<string[]>([]);    // preview URLs

  const sectionChanged = listing && section !== listing.section;

  /* ── Load listing ── */
  useEffect(() => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    const load = async () => {
      try {
        const res = await listingsApi.getOne(Number(id));
        const data = res.data ?? res;

        // Verify ownership
        if (data.user_id !== user?.id) {
          toast.error(isRTL ? 'لا تملك صلاحية تعديل هذا الإعلان' : 'You cannot edit this listing');
          router.push(`/${locale}/dashboard`);
          return;
        }

        setListing(data);
        setSection(data.section ?? '');
        setListingType(data.listing_type ?? '');
        setTitleAr(data.title_ar ?? '');
        setTitleEn(data.title_en ?? '');
        setDescAr(data.description_ar ?? '');
        setCity(data.city ?? '');
        setRegion(data.region ?? '');
        setPrice(data.price != null ? String(data.price) : '');
        setPriceType(data.price_type ?? 'fixed');
        setContactPhone(data.contact_phone ?? '');
        setDynData(data.dynamic_data ?? {});

        // Extract existing image paths
        const imgs = (data.media ?? [])
          .filter((m: any) => m.type === 'image')
          .map((m: any) => m.path);
        setExistingImgs(imgs);
      } catch {
        toast.error(isRTL ? 'تعذر تحميل الإعلان' : 'Failed to load listing');
        router.push(`/${locale}/dashboard`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isAuthenticated]);

  /* ── New image selection ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const total = (existingImgs.length - removedPaths.length) + newFiles.length + files.length;
    if (total > 8) {
      toast.error(isRTL ? 'الحد الأقصى 8 صور' : 'Maximum 8 images allowed');
      return;
    }
    setNewFiles(prev => [...prev, ...files]);
    const previews = files.map(f => URL.createObjectURL(f));
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const removeExistingImg = (path: string) => {
    setRemovedPaths(prev => [...prev, path]);
  };

  const removeNewImg = (idx: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
    URL.revokeObjectURL(newPreviews[idx]);
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  /* ── AI Write ── */
  const handleAiWrite = async () => {
    if (!section) {
      toast.error(isRTL ? 'اختر القسم أولاً' : 'Select a section first');
      return;
    }
    setAiWriting(true);
    try {
      const res = await fetch('/api/ai/write-listing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          section,
          listing_type: listingType,
          fields: { ...dynData, city, price, price_type: priceType },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'AI error');
      }
      const { data } = await res.json();
      if (data?.title_ar)       setTitleAr(data.title_ar);
      if (data?.title_en)       setTitleEn(data.title_en);
      if (data?.description_ar) setDescAr(data.description_ar);
      toast.success(isRTL ? '✨ تم كتابة الإعلان بالذكاء الاصطناعي' : '✨ AI wrote your listing!');
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'فشل الذكاء الاصطناعي' : 'AI failed'));
    } finally {
      setAiWriting(false);
    }
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim()) {
      toast.error(isRTL ? 'العنوان بالعربي مطلوب' : 'Arabic title is required');
      return;
    }
    setSubmitting(true);

    const fd = new FormData();
    fd.append('section',       section);
    fd.append('listing_type',  listingType);
    fd.append('title_ar',      titleAr);
    fd.append('title_en',      titleEn);
    fd.append('description_ar', descAr);
    fd.append('city',          city);
    fd.append('region',        region);
    fd.append('price_type',    priceType);
    fd.append('contact_phone', contactPhone);
    if (price) fd.append('price', price);
    if (Object.keys(dynData).length > 0) {
      fd.append('dynamic_data', JSON.stringify(dynData));
    }
    if (removedPaths.length > 0) {
      fd.append('remove_images', JSON.stringify(removedPaths));
    }
    newFiles.forEach(f => fd.append('images[]', f));

    try {
      await listingsApi.update(Number(id), fd);
      const msg = sectionChanged
        ? (isRTL ? 'تم التحديث — سيُعاد مراجعة الإعلان بسبب تغيير القسم' : 'Updated — listing sent for re-review due to section change')
        : (isRTL ? 'تم تحديث الإعلان بنجاح ✓' : 'Listing updated ✓');
      toast.success(msg);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (isRTL ? 'حدث خطأ' : 'Error');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const dynFields = DYNAMIC_FIELDS[section] ?? [];
  const typeOptions = LISTING_TYPES[section] ?? [];

  /* image URL builder (same as storageUrl but inline) */
  const imgUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/api$/, '');
    return `${base}/uploads/${path}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href={`/${locale}/dashboard`} className="hover:text-emerald transition-colors">
            {isRTL ? 'لوحة التحكم' : 'Dashboard'}
          </Link>
          <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
          <Link href={`/${locale}/listings/${id}`} className="hover:text-emerald transition-colors truncate max-w-[180px]">
            {isRTL ? (listing?.title_ar ?? '') : (listing?.title_en ?? listing?.title_ar ?? '')}
          </Link>
          <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
          <span className="text-gray-600">{isRTL ? 'تعديل' : 'Edit'}</span>
        </nav>

        <h1 className="text-2xl font-black text-navy mb-6">
          {isRTL ? '✏️ تعديل الإعلان' : '✏️ Edit Listing'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section ── */}
          <div className="card p-5">
            <label className="block text-sm font-bold text-navy mb-3">
              {isRTL ? 'القسم' : 'Section'}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {SECTIONS.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition
                              ${section === s.key
                                ? 'border-emerald bg-emerald/5 text-emerald'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <span className="text-xl">{s.emoji}</span>
                  {isRTL ? s.arLabel : s.enLabel}
                </button>
              ))}
            </div>

            {/* Section change warning */}
            {sectionChanged && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200
                              rounded-xl px-3 py-2.5 text-amber-700 text-xs">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                {isRTL
                  ? 'تغيير القسم سيُعيد الإعلان لمرحلة المراجعة من قِبل الفريق قبل نشره.'
                  : 'Changing section will send the listing back for team review before publishing.'}
              </div>
            )}
          </div>

          {/* ── Listing type (fleet / contracts only) ── */}
          {typeOptions.length > 0 && (
            <div className="card p-5">
              <label className="block text-sm font-bold text-navy mb-3">
                {isRTL ? 'نوع الإعلان' : 'Listing Type'}
              </label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setListingType(t.value)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition
                                ${listingType === t.value
                                  ? 'border-emerald bg-emerald/5 text-emerald'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {isRTL ? t.arLabel : t.enLabel}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Titles ── */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy">{isRTL ? 'العنوان والوصف' : 'Title & Description'}</h3>
              <button
                type="button"
                onClick={handleAiWrite}
                disabled={aiWriting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                           bg-gradient-to-r from-violet-500 to-purple-600 text-white
                           hover:opacity-90 transition disabled:opacity-50 shadow-sm"
              >
                {aiWriting
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Sparkles size={12} />}
                {isRTL ? 'اكتب بالذكاء الاصطناعي' : 'Write with AI'}
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                {isRTL ? 'العنوان بالعربي *' : 'Arabic Title *'}
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={e => setTitleAr(e.target.value)}
                className="input"
                dir="rtl"
                required
                placeholder={isRTL ? 'عنوان واضح ومختصر' : 'Clear and concise title in Arabic'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                {isRTL ? 'العنوان بالإنجليزي (اختياري)' : 'English Title (optional)'}
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={e => setTitleEn(e.target.value)}
                className="input"
                dir="ltr"
                placeholder="English title (optional)"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                {isRTL ? 'الوصف' : 'Description'}
              </label>
              <textarea
                value={descAr}
                onChange={e => setDescAr(e.target.value)}
                className="input h-36 resize-none"
                dir="rtl"
                placeholder={isRTL ? 'وصف تفصيلي للإعلان...' : 'Detailed description...'}
              />
            </div>
          </div>

          {/* ── Dynamic fields (section-specific) ── */}
          {dynFields.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-bold text-navy mb-4">
                {isRTL ? 'معلومات إضافية' : 'Additional Details'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dynFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      {isRTL ? field.arLabel : field.enLabel}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={dynData[field.key] ?? ''}
                        onChange={e => setDynData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="input"
                      >
                        <option value="">{isRTL ? 'اختر...' : 'Select...'}</option>
                        {field.options?.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={dynData[field.key] ?? ''}
                        onChange={e => setDynData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="input"
                        min={field.type === 'number' ? 0 : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Location & Price ── */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-navy">{isRTL ? 'الموقع والسعر' : 'Location & Price'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  {isRTL ? 'المدينة' : 'City'}
                </label>
                <select value={city} onChange={e => setCity(e.target.value)} className="input">
                  <option value="">{isRTL ? 'اختر المدينة' : 'Select city'}</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  {isRTL ? 'المنطقة / الحي (اختياري)' : 'Region / District (optional)'}
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="input"
                  placeholder={isRTL ? 'مثال: العليا' : 'e.g. Al-Olaya'}
                />
              </div>
            </div>

            {/* Price type */}
            {section !== 'forum' && (
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  {isRTL ? 'نوع السعر' : 'Price Type'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'fixed',      arLabel: 'سعر ثابت',       enLabel: 'Fixed'       },
                    { value: 'negotiable', arLabel: 'قابل للتفاوض',   enLabel: 'Negotiable'  },
                    { value: 'on_request', arLabel: 'عند الطلب',      enLabel: 'On Request'  },
                  ].map(pt => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => setPriceType(pt.value)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition
                                  ${priceType === pt.value
                                    ? 'border-emerald bg-emerald/5 text-emerald'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {isRTL ? pt.arLabel : pt.enLabel}
                    </button>
                  ))}
                </div>

                {priceType !== 'on_request' && (
                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1.5">
                      {isRTL ? 'السعر (ر.س)' : 'Price (SAR)'}
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="input"
                      min={0}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Contact phone */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                {isRTL ? 'رقم التواصل / واتساب (اختياري)' : 'Contact / WhatsApp (optional)'}
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="input"
                dir="ltr"
                placeholder="+966 5x xxx xxxx"
              />
            </div>
          </div>

          {/* ── Images ── */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-navy mb-4">
              {isRTL ? 'الصور' : 'Photos'}
            </h3>

            {/* Existing images */}
            {existingImgs.filter(p => !removedPaths.includes(p)).length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">
                  {isRTL ? 'الصور الحالية' : 'Current photos'}
                </p>
                <div className="flex flex-wrap gap-3">
                  {existingImgs.filter(p => !removedPaths.includes(p)).map((path, i) => (
                    <div key={path} className="relative w-24 h-20 rounded-xl overflow-hidden group shrink-0">
                      <img
                        src={imgUrl(path)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-1 start-1 text-[9px] bg-emerald text-white
                                         px-1.5 py-0.5 rounded-full font-bold">
                          {isRTL ? 'رئيسية' : 'Main'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingImg(path)}
                        className="absolute top-1 end-1 w-5 h-5 bg-red-500 text-white rounded-full
                                   flex items-center justify-center opacity-0 group-hover:opacity-100
                                   transition text-xs"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New image previews */}
            {newPreviews.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">
                  {isRTL ? 'صور جديدة' : 'New photos'}
                </p>
                <div className="flex flex-wrap gap-3">
                  {newPreviews.map((url, i) => (
                    <div key={i} className="relative w-24 h-20 rounded-xl overflow-hidden group shrink-0">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImg(i)}
                        className="absolute top-1 end-1 w-5 h-5 bg-red-500 text-white rounded-full
                                   flex items-center justify-center opacity-0 group-hover:opacity-100
                                   transition"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300
                         hover:border-emerald rounded-xl text-sm text-gray-500 hover:text-emerald
                         transition w-full justify-center"
            >
              <ImagePlus size={18} />
              {isRTL ? 'إضافة صور جديدة' : 'Add new photos'}
              <span className="text-xs text-gray-400">
                ({(existingImgs.length - removedPaths.length) + newFiles.length}/8)
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
              <Info size={12} />
              {isRTL
                ? 'الصورة الأولى ستكون الصورة الرئيسية. الحد الأقصى 8 صور، 5MB لكل صورة.'
                : 'First photo will be the main image. Max 8 photos, 5MB each.'}
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="flex gap-3 pb-8">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary flex items-center justify-center gap-2
                         disabled:opacity-60 text-base py-3"
            >
              {submitting
                ? <><Loader2 size={18} className="animate-spin" /> {isRTL ? 'جارٍ الحفظ...' : 'Saving...'}</>
                : <><Save size={18} /> {isRTL ? 'حفظ التعديلات' : 'Save Changes'}</>
              }
            </button>
            <Link
              href={`/${locale}/dashboard`}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600
                         hover:border-gray-400 transition text-sm font-semibold flex items-center"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
