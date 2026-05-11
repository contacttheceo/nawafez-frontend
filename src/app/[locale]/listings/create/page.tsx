'use client';

import { useEffect, useState } from 'react';
import { useForm }              from 'react-hook-form';
import { useRouter }            from 'next/navigation';
import { useLocale }            from 'next-intl';
import { ArrowRight, ArrowLeft, MapPin, Phone, DollarSign } from 'lucide-react';
import Link                     from 'next/link';
import toast                    from 'react-hot-toast';

import Navbar          from '@/components/Navbar';
import StepIndicator   from '@/components/listings/StepIndicator';
import SectionFields   from '@/components/listings/SectionFields';
import ImageUploader   from '@/components/listings/ImageUploader';
import ListingPreview  from '@/components/listings/ListingPreview';
import { listingsApi, aiApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { ListingSection } from '@/types';

/* ── Types ────────────────────────────────────────────────────────── */
type FormData = {
  section:          ListingSection;
  listing_type:     string;
  title_ar:         string;
  title_en:         string;
  description_ar:   string;
  vehicle_type:     string;
  condition:        string;
  year:             string;
  mileage:          string;
  capacity:         string;
  job_title:        string;
  employment_type:  string;
  experience_years: string;
  salary_type:      string;
  salary_min:       string;
  salary_max:       string;
  contract_type:    string;
  duration:         string;
  company_type:     string;
  employees_count:  string;
  annual_revenue:   string;
  city:             string;
  region:           string;
  price:            string;
  price_type:       string;
  contact_phone:    string;
};

/* ── Section config ───────────────────────────────────────────────── */
const SECTIONS = [
  { value: 'fleet'     as ListingSection, emoji: '🚛', labelAr: 'أسطول',           labelEn: 'Fleet',      descAr: 'بيع وشراء وإيجار المركبات اللوجستية', descEn: 'Buy, sell & rent logistics vehicles' },
  { value: 'contracts' as ListingSection, emoji: '📄', labelAr: 'عقود',            labelEn: 'Contracts',  descAr: 'عروض وطلبات العقود اللوجستية',         descEn: 'Logistics contract offers & requests' },
  { value: 'jobs'      as ListingSection, emoji: '💼', labelAr: 'وظائف',           labelEn: 'Jobs',       descAr: 'فرص العمل في القطاع اللوجستي',          descEn: 'Job opportunities in logistics' },
  { value: 'forum'     as ListingSection, emoji: '💬', labelAr: 'منتدى',           labelEn: 'Forum',      descAr: 'نقاشات ومعلومات مهنية',                 descEn: 'Professional discussions & insights' },
  { value: 'ma'        as ListingSection, emoji: '🏢', labelAr: 'استحواذ M&A',    labelEn: 'M&A',        descAr: 'فرص الاستحواذ ودمج الشركات',            descEn: 'Mergers & acquisitions opportunities' },
];

const SAUDI_CITIES = [
  'الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','الظهران',
  'تبوك','أبها','نجران','حائل','الجوف','القصيم','بريدة','ينبع',
];

/* ══════════════════════════════════════════════════════════════════ */
export default function CreateListingPage() {
  const locale   = useLocale();
  const router   = useRouter();
  const isRTL    = locale === 'ar';
  const { isAuthenticated, user } = useAuthStore();

  const [step,          setStep]          = useState(1);
  const [images,        setImages]        = useState<File[]>([]);
  const [previews,      setPreviews]      = useState<string[]>([]);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [aiWriting,     setAiWriting]     = useState(false);

  // Step 0 — AI Smart Fill
  const [showAiIntro,   setShowAiIntro]   = useState(true);
  const [aiText,        setAiText]        = useState('');
  const [aiExtracting,  setAiExtracting]  = useState(false);
  const [extractedData, setExtractedData] = useState<{
    section: string; listing_type: string;
    fields: Record<string, string>; missing: string[]; summary_ar: string;
  } | null>(null);

  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  /* ── Auth guard ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) router.push(`/${locale}/auth/login`);
  }, [isAuthenticated, locale, router]);

  /* ── Unsaved changes warning ────────────────────────────────────── */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step > 1) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  /* ── Form ───────────────────────────────────────────────────────── */
  const {
    register, handleSubmit, watch, trigger, setValue, formState: { errors },
  } = useForm<FormData>({ defaultValues: { section: 'fleet', price_type: 'fixed' } });

  const selectedSection = watch('section');
  const allValues       = watch();

  /* ── Image handlers ─────────────────────────────────────────────── */
  const handleAddImages = (files: File[]) => {
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImages((p) => [...p, ...files]);
    setPreviews((p) => [...p, ...newPreviews]);
  };

  const handleRemoveImage = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setImages((p)   => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  /* ── AI Smart Extract (Step 0) ─────────────────────────────────────── */
  const handleAiExtract = async () => {
    if (!aiText.trim()) return;
    setAiExtracting(true);
    try {
      const res = await aiApi.extractListing({ text: aiText });
      // Pre-fill form fields
      if (res.section)              setValue('section',          res.section as any);
      if (res.listing_type)         setValue('listing_type',     res.listing_type);
      if (res.fields.vehicle_type)  setValue('vehicle_type',     res.fields.vehicle_type);
      if (res.fields.year)          setValue('year',             res.fields.year);
      if (res.fields.mileage)       setValue('mileage',          res.fields.mileage);
      if (res.fields.capacity)      setValue('capacity',         res.fields.capacity);
      if (res.fields.city)          setValue('city',             res.fields.city);
      if (res.fields.price)         setValue('price',            res.fields.price);
      if (res.fields.job_title)     setValue('job_title',        res.fields.job_title);
      if (res.fields.employment_type) setValue('employment_type', res.fields.employment_type);
      if (res.fields.contract_type) setValue('contract_type',    res.fields.contract_type);
      if (res.fields.company_type)  setValue('company_type',     res.fields.company_type);
      setExtractedData(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (isRTL ? 'فشل التحليل، حاول مجدداً' : 'Analysis failed, try again'));
    } finally {
      setAiExtracting(false);
    }
  };

  const handleConfirmExtract = () => {
    setShowAiIntro(false);
  };

  /* ── Duplicate detection ────────────────────────────────────────────── */
  const checkDuplicate = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const res = await listingsApi.getAll({ section: selectedSection, sort: 'newest' });
      const listings: any[] = res.data ?? [];
      const myRecent = listings.find((l: any) => {
        if (Number(l.user_id) !== Number(user.id)) return false;
        const ageInDays = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return ageInDays < 90;
      });
      if (myRecent) { setDuplicateWarning(myRecent); return true; }
    } catch { /* ignore — don't block */ }
    return false;
  };

  /* ── AI Listing Writer ─────────────────────────────────────────────── */
  const handleAiWrite = async () => {
    const v = watch();
    // Build fields from the dynamic data filled so far
    const dynamicKeys: (keyof FormData)[] = [
      'vehicle_type', 'condition', 'year', 'mileage', 'capacity',
      'job_title', 'employment_type', 'experience_years', 'salary_type', 'salary_min', 'salary_max',
      'contract_type', 'duration',
      'company_type', 'employees_count', 'annual_revenue',
      'listing_type',
    ];
    const fields: Record<string, string> = {};
    dynamicKeys.forEach(k => { if (v[k]) fields[k] = String(v[k]); });

    if (Object.keys(fields).length === 0) {
      toast(isRTL ? '⚠️ أدخل بعض البيانات أولاً حتى يتمكن الذكاء الاصطناعي من الكتابة' : '⚠️ Fill in some fields first so AI can write', { icon: '⚠️' });
      return;
    }

    setAiWriting(true);
    try {
      const res = await aiApi.writeListing({
        section:      v.section,
        listing_type: v.listing_type || undefined,
        fields,
      });
      setValue('title_ar',       res.data.title_ar);
      setValue('title_en',       res.data.title_en);
      setValue('description_ar', res.data.description_ar);
      toast.success(isRTL ? '✨ تم كتابة الإعلان بالذكاء الاصطناعي' : '✨ AI wrote your listing!');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'unknown error';
      toast.error(msg, { duration: 6000 });
    } finally {
      setAiWriting(false);
    }
  };

  const handleReorderImages = (from: number, to: number) => {
    const reorder = <T,>(arr: T[]) => {
      const a = [...arr];
      const [item] = a.splice(from, 1);
      a.splice(to, 0, item);
      return a;
    };
    setImages((p)   => reorder(p));
    setPreviews((p) => reorder(p));
  };

  /* ── Navigation ─────────────────────────────────────────────────── */
  const goNext = async () => {
    const fieldsToValidate: (keyof FormData)[][] = [
      ['section'],
      ['title_ar', 'description_ar'],
      [],
      [],
    ];
    const valid = await trigger(fieldsToValidate[step - 1]);
    if (!valid) return;
    // Duplicate check after step 2 (we now know section + listing_type)
    if (step === 2) {
      const hasDuplicate = await checkDuplicate();
      if (hasDuplicate) return; // modal handles navigation
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  /* ── Submit ─────────────────────────────────────────────────────── */
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Sections that don't have a listing_type radio → inject default value
      if (!data.listing_type) {
        const defaults: Record<string, string> = {
          jobs:  'job',
          forum: 'discussion',
          ma:    'acquisition',
        };
        if (defaults[data.section]) data.listing_type = defaults[data.section];
      }

      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, String(v)); });
      images.forEach((img) => formData.append('images[]', img));
      const res = await listingsApi.create(formData);
      toast.success(isRTL ? '🎉 تم نشر إعلانك بنجاح!' : '🎉 Listing published!');
      router.push(`/${locale}/listings/${res.data?.id ?? ''}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (isRTL ? 'حدث خطأ.' : 'Something went wrong.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  const userName = isRTL
    ? (user?.name_ar ?? user?.name_en ?? '')
    : (user?.name_en ?? user?.name_ar ?? '');

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="bg-navy text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Link href={`/${locale}/listings`}
              className="text-white/60 hover:text-white text-sm transition flex items-center gap-1">
              {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              {isRTL ? 'الإعلانات' : 'Listings'}
            </Link>
          </div>
          <h1 className="text-2xl font-black">
            {isRTL ? '✍️ نشر إعلان جديد' : '✍️ Post a New Listing'}
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {isRTL ? 'اتبع الخطوات لنشر إعلانك على منصة نوافذ' : 'Follow the steps to publish on Nawafez'}
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        {/* ══════════ STEP 0 — AI Smart Fill (optional) ══════════ */}
        {showAiIntro ? (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">✨</span>
              <h2 className="text-lg font-bold text-navy">
                {isRTL ? 'صف إعلانك ونملأ النموذج تلقائياً' : 'Describe your listing — we\'ll fill the form'}
              </h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {isRTL
                ? 'اكتب جملة أو أكثر بكلماتك الطبيعية وسيستخرج الذكاء الاصطناعي كل التفاصيل'
                : 'Write naturally and AI will extract all details for you'}
            </p>

            <textarea
              value={aiText}
              onChange={(e) => { setAiText(e.target.value); setExtractedData(null); }}
              className="input text-sm min-h-[100px] resize-none mb-4 w-full"
              dir="rtl"
              placeholder={isRTL
                ? 'مثال: شاحنة مرسيدس أكتروس 2020 حمولة 30 طن مستعملة أبيعها بـ 350 ألف ريال في الرياض'
                : 'e.g. Selling a used 2020 Mercedes Actros 30-ton truck for 350k SAR in Riyadh'}
            />

            {/* Extracted summary */}
            {extractedData && (
              <div className="bg-emerald/5 border border-emerald/20 rounded-xl p-4 mb-4">
                <p className="text-xs font-bold text-emerald mb-2">
                  ✅ {isRTL ? 'تم استخراج البيانات التالية:' : 'Extracted data:'}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(extractedData.fields).map(([k, v]) =>
                    v ? (
                      <span key={k} className="bg-white border border-emerald/30 rounded-lg px-2 py-1 text-xs text-gray-700">
                        {v}
                      </span>
                    ) : null
                  )}
                </div>
                {extractedData.missing.length > 0 && (
                  <p className="text-xs text-amber-600">
                    ⚠️ {isRTL
                      ? `لم أجد: ${extractedData.missing.join('، ')} — يمكنك إضافتها في الخطوة التالية`
                      : `Not found: ${extractedData.missing.join(', ')} — add them in the next step`}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAiIntro(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
              >
                {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                {isRTL ? 'تخطي — أملأ يدوياً' : 'Skip — fill manually'}
              </button>

              <div className="flex gap-2">
                {extractedData && (
                  <button
                    type="button"
                    onClick={handleConfirmExtract}
                    className="btn-primary text-sm"
                  >
                    {isRTL ? 'تأكيد والمتابعة →' : 'Confirm & Continue →'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAiExtract}
                  disabled={aiExtracting || !aiText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500
                             to-purple-600 text-white text-sm font-bold rounded-xl hover:opacity-90
                             transition disabled:opacity-40 shadow-md"
                >
                  {aiExtracting
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <span>✨</span>}
                  {isRTL
                    ? (aiExtracting ? 'جارٍ التحليل…' : 'تحليل وملء الحقول')
                    : (aiExtracting ? 'Analyzing…'    : 'Analyze & Fill')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
        <StepIndicator current={step} isRTL={isRTL} />

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* ══════════ STEP 1 — Section ══════════ */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-navy mb-1">
                {isRTL ? 'اختر قسم إعلانك' : 'Choose a Section'}
              </h2>
              <p className="text-sm text-gray-400 mb-5">
                {isRTL ? 'حدد نوع الإعلان الذي تريد نشره' : 'Select the type of listing you want to post'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SECTIONS.map((s) => (
                  <label key={s.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                                transition-all hover:shadow-sm
                                ${selectedSection === s.value
                                  ? 'border-emerald bg-emerald/5 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" value={s.value}
                      {...register('section', { required: true })}
                      className="accent-emerald mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">
                        {s.emoji} {isRTL ? s.labelAr : s.labelEn}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {isRTL ? s.descAr : s.descEn}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ STEP 2 — Section fields ══════════ */}
          {step === 2 && (
            <div className="card p-6">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-navy mb-1">
                    {isRTL ? 'تفاصيل الإعلان' : 'Listing Details'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {isRTL ? 'أكمل المعلومات المطلوبة بدقة' : 'Fill in the required information accurately'}
                  </p>
                </div>

                {/* ✨ AI Writer Button */}
                <button
                  type="button"
                  onClick={handleAiWrite}
                  disabled={aiWriting}
                  className="flex items-center gap-2 px-4 py-2 shrink-0
                             bg-gradient-to-r from-violet-500 to-purple-600
                             text-white text-sm font-bold rounded-xl
                             hover:opacity-90 transition disabled:opacity-50
                             shadow-md shadow-purple-200"
                >
                  {aiWriting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent
                                     rounded-full animate-spin inline-block" />
                  ) : (
                    <span>✨</span>
                  )}
                  {isRTL
                    ? (aiWriting ? 'جارٍ الكتابة…' : 'اكتب بالذكاء الاصطناعي')
                    : (aiWriting ? 'Writing…'       : 'Write with AI')}
                </button>
              </div>

              <SectionFields
                section={selectedSection}
                isRTL={isRTL}
                reg={register as any}
                errors={errors as any}
                watch={watch as any}
              />
            </div>
          )}

          {/* ══════════ STEP 3 — Location & Price ══════════ */}
          {step === 3 && (
            <div className="card p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-navy mb-1">
                  {isRTL ? 'الموقع والسعر' : 'Location & Price'}
                </h2>
                <p className="text-sm text-gray-400">
                  {selectedSection === 'forum'
                    ? (isRTL ? 'الموقع والسعر اختياريان في المنتدى' : 'Location & price are optional for forum posts')
                    : (isRTL ? 'حدد موقع الإعلان وسعره' : 'Specify location and price')}
                </p>
              </div>

              {/* City + Region */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <MapPin size={13} className="text-gray-400" />
                    {isRTL ? 'المدينة' : 'City'}
                    {selectedSection !== 'forum' && ' *'}
                  </label>
                  <select
                    {...register('city', { required: selectedSection !== 'forum' })}
                    className="input text-sm">
                    <option value="">{isRTL ? 'اختر المدينة' : 'Select city'}</option>
                    {SAUDI_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.city && <p className="text-red-500 text-xs mt-0.5">{isRTL ? 'مطلوب' : 'Required'}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'الحي / المنطقة' : 'District / Area'}
                  </label>
                  <input {...register('region')} className="input text-sm"
                    placeholder={isRTL ? 'اختياري' : 'Optional'} />
                </div>
              </div>

              {/* Price type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <DollarSign size={13} className="text-gray-400" />
                  {isRTL ? 'نوع السعر' : 'Price Type'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: 'fixed',      ar: '💵 سعر ثابت',       en: '💵 Fixed Price'  },
                    { v: 'negotiable', ar: '🤝 قابل للتفاوض',   en: '🤝 Negotiable'   },
                    { v: 'on_request', ar: '📞 عند الطلب',       en: '📞 On Request'   },
                  ].map((o) => (
                    <label key={o.v} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200
                                                cursor-pointer hover:border-emerald text-sm
                                                has-[:checked]:border-emerald has-[:checked]:bg-emerald/5 transition">
                      <input type="radio" value={o.v} {...register('price_type')} className="accent-emerald" />
                      {isRTL ? o.ar : o.en}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price amount */}
              {watch('price_type') !== 'on_request' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRTL ? 'السعر (ر.س)' : 'Price (SAR)'}
                  </label>
                  <input type="number" min="0" {...register('price')} className="input text-sm" placeholder="0" />
                </div>
              )}

              {/* Contact phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone size={13} className="text-gray-400" />
                  {isRTL ? 'رقم الواتساب / الجوال (اختياري)' : 'WhatsApp / Phone (optional)'}
                </label>
                <input
                  type="tel"
                  {...register('contact_phone')}
                  className="input text-sm"
                  dir="ltr"
                  placeholder="+966 5X XXX XXXX"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {isRTL ? 'سيظهر للمشترين المهتمين للتواصل معك مباشرةً' : 'Shown to interested buyers for direct contact'}
                </p>
              </div>
            </div>
          )}

          {/* ══════════ STEP 4 — Images ══════════ */}
          {step === 4 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-navy mb-1">
                {isRTL ? 'صور الإعلان' : 'Listing Images'}
              </h2>
              <p className="text-sm text-gray-400 mb-5">
                {isRTL
                  ? 'الصورة الأولى هي الصورة الرئيسية — اسحبها لإعادة الترتيب'
                  : 'First image is the main one — drag to reorder'}
              </p>
              <ImageUploader
                images={images}
                previews={previews}
                onAdd={handleAddImages}
                onRemove={handleRemoveImage}
                onReorder={handleReorderImages}
                isRTL={isRTL}
                maxImages={8}
              />
              <p className="text-xs text-center text-gray-400 mt-4">
                {isRTL
                  ? 'الصور اختيارية — يمكنك نشر الإعلان بدون صور'
                  : 'Images are optional — you can publish without them'}
              </p>
            </div>
          )}

          {/* ══════════ STEP 5 — Preview & Publish ══════════ */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="card p-5 text-center">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {isRTL ? '🎉 إعلانك جاهز للنشر!' : '🎉 Your listing is ready!'}
                </p>
                <p className="text-xs text-gray-400">
                  {isRTL
                    ? 'راجع المعاينة أدناه ثم اضغط "نشر الإعلان"'
                    : 'Review the preview below then click "Publish"'}
                </p>
              </div>

              <ListingPreview
                data={allValues as any}
                previews={previews}
                isRTL={isRTL}
                userName={userName}
              />

              {/* M&A notice */}
              {selectedSection === 'ma' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                  ⚠️ {isRTL
                    ? 'سيخضع هذا الإعلان للمراجعة من فريق نوافذ قبل ظهوره للعموم.'
                    : 'This listing will be reviewed by the Nawafez team before going public.'}
                </div>
              )}

              {/* Publish button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-4 text-base font-bold disabled:opacity-60"
              >
                {isSubmitting
                  ? (isRTL ? '⏳ جارٍ النشر…' : '⏳ Publishing…')
                  : (isRTL ? '🚀 نشر الإعلان' : '🚀 Publish Listing')}
              </button>
            </div>
          )}

          {/* ── Navigation buttons ──────────────────────────────── */}
          <div className={`flex mt-6 gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="btn-secondary flex items-center gap-2"
              >
                {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                {isRTL ? 'السابق' : 'Back'}
              </button>
            )}

            {step < 5 && (
              <button
                type="button"
                onClick={goNext}
                className="btn-primary flex items-center gap-2"
              >
                {isRTL ? 'التالي' : 'Next'}
                {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            )}
          </div>
        </form>
          </>
        )}

        {/* ── Duplicate Warning Modal ──────────────────────────────── */}
        {duplicateWarning && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="text-3xl mb-3 text-center">⚠️</div>
              <h3 className="font-bold text-navy text-lg mb-2 text-center">
                {isRTL ? 'لديك إعلان مشابه' : 'Similar listing found'}
              </h3>
              <p className="text-sm text-gray-500 mb-1 text-center">
                {isRTL ? 'منشور منذ' : 'Posted'}{' '}
                {Math.ceil((Date.now() - new Date(duplicateWarning.created_at).getTime()) / (1000 * 60 * 60 * 24))}{' '}
                {isRTL ? 'يوماً' : 'days ago'}
              </p>
              <p className="text-sm font-semibold text-center text-navy mb-5 line-clamp-2">
                {isRTL ? duplicateWarning.title_ar : (duplicateWarning.title_en || duplicateWarning.title_ar)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/listings/${duplicateWarning.id}/edit`)}
                  className="flex-1 btn-secondary text-sm py-2.5"
                >
                  {isRTL ? 'تحديث القديم' : 'Update old listing'}
                </button>
                <button
                  type="button"
                  onClick={() => { setDuplicateWarning(null); setStep(3); }}
                  className="flex-1 btn-primary text-sm py-2.5"
                >
                  {isRTL ? 'نشر جديد' : 'Post new'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
