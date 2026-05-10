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

  const [step,       setStep]       = useState(1);
  const [images,     setImages]     = useState<File[]>([]);
  const [previews,   setPreviews]   = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiWriting,  setAiWriting]  = useState(false);

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
    } catch {
      toast.error(isRTL ? 'فشل الذكاء الاصطناعي، حاول مجدداً' : 'AI failed, please try again');
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
    if (valid) setStep((s) => Math.min(s + 1, 5));
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
      </main>
    </div>
  );
}
