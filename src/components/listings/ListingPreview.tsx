'use client';

import { MapPin, Clock, Eye, Phone } from 'lucide-react';

interface PreviewData {
  section:      string;
  title_ar:     string;
  title_en:     string;
  description_ar: string;
  city:         string;
  price:        string;
  price_type:   string;
  contact_phone: string;
  listing_type: string;
  // section-specific
  vehicle_type?: string;
  condition?:    string;
  year?:         string;
  job_title?:    string;
  employment_type?: string;
  company_type?: string;
}

interface Props {
  data:     PreviewData;
  previews: string[];
  isRTL:    boolean;
  userName: string;
}

const sectionEmoji: Record<string, string> = {
  ma: '🏢', fleet: '🚛', contracts: '📄', jobs: '💼', forum: '💬',
};

const sectionLabel: Record<string, { ar: string; en: string }> = {
  ma:        { ar: 'استحواذ', en: 'M&A' },
  fleet:     { ar: 'أسطول',  en: 'Fleet' },
  contracts: { ar: 'عقود',   en: 'Contracts' },
  jobs:      { ar: 'وظائف',  en: 'Jobs' },
  forum:     { ar: 'منتدى',  en: 'Forum' },
};

const imgBg: Record<string, string> = {
  ma:        'from-green-100 to-green-200',
  fleet:     'from-blue-100 to-blue-200',
  contracts: 'from-amber-100 to-amber-200',
  jobs:      'from-purple-100 to-purple-200',
  forum:     'from-red-100 to-red-200',
};

export default function ListingPreview({ data, previews, isRTL, userName }: Props) {
  const title = isRTL
    ? (data.title_ar || data.title_en || (isRTL ? 'بدون عنوان' : 'No title'))
    : (data.title_en || data.title_ar || 'No title');

  const priceDisplay = () => {
    if (!data.price || data.price_type === 'on_request') return isRTL ? 'عند الطلب' : 'On Request';
    if (data.price_type === 'negotiable') return isRTL ? `${Number(data.price).toLocaleString('ar-SA')} ر.س (قابل للتفاوض)` : `${Number(data.price).toLocaleString()} SAR (Negotiable)`;
    return isRTL ? `${Number(data.price).toLocaleString('ar-SA')} ر.س` : `${Number(data.price).toLocaleString()} SAR`;
  };

  return (
    <div className="max-w-sm mx-auto">
      <p className="text-xs text-center text-gray-400 mb-3 font-medium uppercase tracking-wide">
        {isRTL ? 'معاينة الإعلان' : 'Listing Preview'}
      </p>

      <article className="card overflow-hidden border-2 border-emerald/30 shadow-lg">
        {/* Image / placeholder */}
        <div className={`h-48 bg-gradient-to-br ${imgBg[data.section] || 'from-gray-100 to-gray-200'}
                         flex items-center justify-center text-6xl relative`}>
          {previews[0]
            ? <img src={previews[0]} alt="" className="w-full h-full object-cover" />
            : <span>{sectionEmoji[data.section] || '📋'}</span>}

          {/* Section badge */}
          <span className="absolute top-3 start-3 bg-white/90 text-navy text-[10px]
                           font-bold px-2 py-1 rounded-md shadow">
            {sectionEmoji[data.section]} {isRTL ? sectionLabel[data.section]?.ar : sectionLabel[data.section]?.en}
          </span>

          {previews.length > 1 && (
            <span className="absolute bottom-2 end-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              +{previews.length - 1}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2" dir={isRTL ? 'rtl' : 'ltr'}>
            {title}
          </h3>

          {data.description_ar && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3" dir="rtl">
              {data.description_ar}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
            {data.city && (
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {data.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} /> {isRTL ? 'الآن' : 'Just now'}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={11} /> 0
            </span>
          </div>

          {/* Price */}
          {(data.price || data.price_type === 'on_request') && (
            <div className="text-lg font-black text-navy">
              {priceDisplay()}
            </div>
          )}

          {/* Contact */}
          {data.contact_phone && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald">
              <Phone size={12} />
              <span dir="ltr">{data.contact_phone}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center
                          text-white text-[10px] font-bold">
            {userName.charAt(0) || '?'}
          </div>
          <span className="text-xs text-gray-500 truncate">{userName}</span>
        </div>
      </article>
    </div>
  );
}
