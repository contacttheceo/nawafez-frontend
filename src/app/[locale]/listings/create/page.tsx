'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Upload, X, Plus } from 'lucide-react';
import { listingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import type { ListingSection } from '@/types';

type FormData = {
  section:        ListingSection;
  listing_type:   string;
  title_ar:       string;
  title_en:       string;
  description_ar: string;
  city:           string;
  region:         string;
  price:          string;
};

const SECTIONS: { value: ListingSection; labelAr: string; labelEn: string }[] = [
  { value: 'fleet',     labelAr: 'أسطول — عرض/طلب',         labelEn: 'Fleet — Buy/Sell'         },
  { value: 'contracts', labelAr: 'عقود لوجستية',             labelEn: 'Logistics Contracts'      },
  { value: 'jobs',      labelAr: 'وظائف',                   labelEn: 'Jobs'                     },
  { value: 'forum',     labelAr: 'منتدى / نقاش',            labelEn: 'Forum / Discussion'        },
  { value: 'ma',        labelAr: 'استحواذ ودمج (M&A)',       labelEn: 'M&A'                      },
];

const SAUDI_CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
  'الخبر', 'الظهران', 'تبوك', 'أبها', 'نجران', 'حائل',
  'الجوف', 'القصيم', 'بريدة', 'ينبع',
];

export default function CreateListingPage() {
  const locale          = useLocale();
  const router          = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [images, setImages]           = useState<File[]>([]);
  const [previews, setPreviews]       = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { section: 'fleet' } });

  const selectedSection = watch('section');

  // Redirect if not logged in
  if (!isAuthenticated) {
    router.push(`/${locale}/auth/login`);
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 8) {
      toast.error(locale === 'ar' ? 'الحد الأقصى 8 صور' : 'Max 8 images allowed');
      return;
    }
    const newImages   = [...images, ...files];
    const newPreviews = [...previews, ...files.map((f) => URL.createObjectURL(f))];
    setImages(newImages);
    setPreviews(newPreviews);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, String(v)); });
      images.forEach((img) => formData.append('images[]', img));

      const res = await listingsApi.create(formData);
      toast.success(locale === 'ar' ? 'تم نشر الإعلان بنجاح!' : 'Listing published!');
      router.push(`/${locale}/listings/${res.data?.id ?? ''}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (locale === 'ar' ? 'حدث خطأ.' : 'Something went wrong.');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-navy mb-2">
          {locale === 'ar' ? 'نشر إعلان جديد' : 'Post a New Listing'}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          {locale === 'ar'
            ? 'أكمل البيانات التالية لنشر إعلانك على منصة نوافذ'
            : 'Fill in the details below to publish your listing on Nawafez'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-navy">
              {locale === 'ar' ? '1. اختر القسم' : '1. Choose Section'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SECTIONS.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition
                    ${selectedSection === s.value ? 'border-emerald bg-emerald/5' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    value={s.value}
                    {...register('section', { required: true })}
                    className="accent-emerald"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {locale === 'ar' ? s.labelAr : s.labelEn}
                  </span>
                </label>
              ))}
            </div>

            {/* M&A note */}
            {selectedSection === 'ma' && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                {locale === 'ar'
                  ? 'إعلانات الاستحواذ والدمج تخضع للمراجعة قبل النشر'
                  : 'M&A listings are reviewed before publishing'}
              </p>
            )}
          </div>

          {/* Basic info */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-navy">
              {locale === 'ar' ? '2. معلومات الإعلان' : '2. Listing Information'}
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'ar' ? 'نوع الإعلان' : 'Listing Type'} *
              </label>
              <input
                {...register('listing_type', { required: true })}
                className="input"
                placeholder={locale === 'ar' ? 'مثال: شاحنة للبيع، مطلوب سائق، عقد توزيع…' : 'e.g. Truck for sale, Driver wanted…'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'ar' ? 'العنوان بالعربية' : 'Title (Arabic)'} *
              </label>
              <input
                {...register('title_ar', { required: true })}
                className="input"
                placeholder={locale === 'ar' ? 'عنوان واضح ومختصر' : 'Clear and concise title'}
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'ar' ? 'العنوان بالإنجليزية (اختياري)' : 'Title (English, optional)'}
              </label>
              <input
                {...register('title_en')}
                className="input"
                placeholder="English title (optional)"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'ar' ? 'وصف الإعلان' : 'Description'}
              </label>
              <textarea
                {...register('description_ar')}
                className="input min-h-[120px] resize-y"
                placeholder={locale === 'ar' ? 'اكتب تفاصيل الإعلان هنا…' : 'Describe your listing in detail…'}
                dir="rtl"
              />
            </div>
          </div>

          {/* Location + price */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-navy">
              {locale === 'ar' ? '3. الموقع والسعر' : '3. Location & Price'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ar' ? 'المدينة' : 'City'} *
                </label>
                <select {...register('city', { required: true })} className="input">
                  <option value="">{locale === 'ar' ? 'اختر المدينة' : 'Select city'}</option>
                  {SAUDI_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ar' ? 'المنطقة (اختياري)' : 'Region (optional)'}
                </label>
                <input
                  {...register('region')}
                  className="input"
                  placeholder={locale === 'ar' ? 'الحي / المنطقة' : 'District / Area'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'ar' ? 'السعر (ر.س) — اتركه فارغاً للسعر عند الطلب' : 'Price (SAR) — Leave empty for "on request"'}
              </label>
              <input
                type="number"
                min="0"
                {...register('price')}
                className="input"
                placeholder="0"
              />
            </div>
          </div>

          {/* Images */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-navy">
              {locale === 'ar' ? '4. الصور (اختياري — حتى 8 صور)' : '4. Images (optional — up to 8)'}
            </h2>

            {/* Preview grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 start-1 bg-emerald text-white text-[10px] px-1.5 py-0.5 rounded">
                        {locale === 'ar' ? 'رئيسية' : 'Main'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 end-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 8 && (
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-emerald transition">
                <Upload className="text-gray-400 w-8 h-8" />
                <span className="text-sm text-gray-500">
                  {locale === 'ar' ? 'انقر لرفع الصور (JPG, PNG — 5MB max)' : 'Click to upload (JPG, PNG — 5MB max)'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full text-base py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? (locale === 'ar' ? 'جارٍ النشر…' : 'Publishing…')
              : (locale === 'ar' ? 'نشر الإعلان' : 'Publish Listing')}
          </button>
        </form>
      </div>
    </main>
  );
}
