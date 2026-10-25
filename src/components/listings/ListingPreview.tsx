'use client';

import { MapPin, Clock, Eye, Phone, Calendar, BadgeCheck } from 'lucide-react';
import CategoryPlaceholder from '@/components/ui/CategoryPlaceholder';

/**
 * The preview card used on the final step of the create-listing flow.
 *
 * Shows the user *everything* they filled — the earlier version only
 * surfaced title/description/city/price, so most structured fields
 * (vehicle type, year, mileage, salary, employment type, company
 * details, FAQ category…) were hidden and the user could not sanity-
 * check their post before publishing. The expanded preview mirrors the
 * card the buyer eventually sees on the detail page.
 */

interface PreviewData {
  section:          string
  title_ar:         string
  title_en:         string
  description_ar:   string
  city:             string
  region?:          string
  price:            string
  price_type:       string
  contact_phone:    string
  contact_email?:   string
  listing_type:     string
  forum_category?:  string
  // Fleet
  vehicle_type?:    string
  condition?:       string
  year?:            string
  mileage?:         string
  capacity?:        string
  // Jobs
  job_title?:        string
  employment_type?:  string
  experience_years?: string
  salary_type?:      string
  salary_min?:       string
  salary_max?:       string
  license_required?: string
  // Contracts
  contract_type?:   string
  duration?:        string
  cargo_type?:      string
  destinations?:    string
  payment_terms?:   string
  // M&A
  company_type?:    string
  employees_count?: string
  annual_revenue?:  string
}

interface Props {
  data:     PreviewData
  previews: string[]
  isRTL:    boolean
  userName: string
}

const sectionEmoji: Record<string, string> = {
  ma: '🏢', fleet: '🚛', contracts: '📄', jobs: '💼', forum: '💬',
}

const sectionLabel: Record<string, { ar: string; en: string }> = {
  ma:        { ar: 'استحواذ', en: 'M&A' },
  fleet:     { ar: 'أسطول',  en: 'Fleet' },
  contracts: { ar: 'عقود',   en: 'Contracts' },
  jobs:      { ar: 'وظائف',  en: 'Jobs' },
  forum:     { ar: 'منتدى',  en: 'Forum' },
}

const listingTypeLabel: Record<string, { ar: string; en: string; color: string }> = {
  sale:        { ar: '🏷️ للبيع',       en: '🏷️ For Sale',    color: 'bg-blue-100 text-blue-700' },
  rent:        { ar: '🔄 للإيجار',     en: '🔄 For Rent',    color: 'bg-amber-100 text-amber-700' },
  wanted:      { ar: '🔍 مطلوب',       en: '🔍 Wanted',      color: 'bg-purple-100 text-purple-700' },
  offer:       { ar: '📤 معروض',       en: '📤 Offering',    color: 'bg-emerald-100 text-emerald-700' },
  job:         { ar: '💼 وظيفة',       en: '💼 Job',         color: 'bg-purple-100 text-purple-700' },
  discussion:  { ar: '💬 نقاش',         en: '💬 Discussion',  color: 'bg-rose-100 text-rose-700' },
  acquisition: { ar: '🏢 استحواذ',     en: '🏢 Acquisition', color: 'bg-indigo-100 text-indigo-700' },
  merger:      { ar: '🤝 دمج',          en: '🤝 Merger',      color: 'bg-indigo-100 text-indigo-700' },
  investment:  { ar: '💰 استثمار',     en: '💰 Investment',  color: 'bg-emerald-100 text-emerald-700' },
}

const conditionLabel: Record<string, { ar: string; en: string }> = {
  new:  { ar: '✨ جديد',    en: '✨ New' },
  used: { ar: '🔧 مستعمل', en: '🔧 Used' },
}

const forumCategoryLabel: Record<string, { ar: string; en: string }> = {
  legal:       { ar: '⚖️ قانوني',   en: '⚖️ Legal' },
  financial:   { ar: '💰 مالي',     en: '💰 Financial' },
  operational: { ar: '⚙️ تشغيلي',  en: '⚙️ Operational' },
  logistics:   { ar: '🚚 لوجستي',  en: '🚚 Logistics' },
}

const vehicleTypeLabel: Record<string, string> = {
  truck: 'شاحنة', semi: 'نصف نقل', trailer: 'مقطورة', crane: 'رافعة',
  tanker: 'صهريج', refrigerator: 'مبرّدة', pickup: 'بيك آب',
  car: 'سيارة', motorcycle: 'دراجة نارية', other: 'أخرى',
}

const contractTypeLabel: Record<string, string> = {
  distribution: 'توزيع', transport: 'نقل بضائع', delivery: 'توصيل طلبات',
  warehousing: 'تخزين', lastmile: 'توصيل أخير', customs: 'تخليص جمركي', other: 'أخرى',
}

const cargoTypeLabel: Record<string, string> = {
  general: 'بضائع عامة', food: 'مواد غذائية', pharma: 'أدوية',
  building: 'مواد بناء', vehicles: 'سيارات / معدات',
  containers: 'حاويات', hazmat: 'مواد خطرة', other: 'أخرى',
}

const paymentTermsLabel: Record<string, string> = {
  on_delivery: 'عند التسليم', weekly: 'أسبوعي', monthly: 'شهري',
  net30: '30 يوم', net60: '60 يوم', negotiable: 'حسب الاتفاق',
}

const licenseLabel: Record<string, string> = {
  general: 'عامة', class5: 'فئة خامسة', class6: 'فئة سادسة',
  hazmat: 'HAZMAT', bus: 'باص / نقل عام',
}

const employmentTypeLabel: Record<string, string> = {
  full: 'دوام كامل', part: 'دوام جزئي', contract: 'عقد مؤقت',
}

const companyTypeLabel: Record<string, string> = {
  transport: 'شركة نقل وشحن', warehousing: 'خدمات تخزين',
  tech: 'تقنية لوجستية', customs: 'تخليص جمركي',
  fleet: 'إدارة أسطول', other: 'أخرى',
}

/**
 * Collect the structured specs filled by the user into a label/value
 * grid. Only shows the fields that are relevant to the current section
 * AND have a value — a Jobs listing never surfaces mileage, and a
 * blank mileage never surfaces at all.
 */
function buildSpecs(data: PreviewData, isRTL: boolean): Array<{ k: string; v: string }> {
  const specs: Array<{ k: string; v: string }> = []
  const push = (k: string, v: string | undefined) => {
    if (v && v.trim && v.trim()) specs.push({ k, v: v.trim() })
    else if (typeof v === 'string' && v) specs.push({ k, v })
  }

  // Fleet
  if (data.section === 'fleet') {
    if (data.vehicle_type) push(isRTL ? 'نوع المركبة' : 'Vehicle', vehicleTypeLabel[data.vehicle_type] ?? data.vehicle_type)
    if (data.condition)    push(isRTL ? 'الحالة'       : 'Condition', (conditionLabel[data.condition]?.[isRTL ? 'ar' : 'en']) ?? data.condition)
    push(isRTL ? 'سنة الصنع'   : 'Year',     data.year)
    push(isRTL ? 'العدّاد (كم)' : 'Mileage',  data.mileage ? Number(data.mileage).toLocaleString(isRTL ? 'ar-SA' : 'en-US') : undefined)
    push(isRTL ? 'الحمولة'     : 'Capacity', data.capacity)
  }

  // Contracts
  if (data.section === 'contracts') {
    if (data.contract_type) push(isRTL ? 'نوع العقد' : 'Contract', contractTypeLabel[data.contract_type] ?? data.contract_type)
    push(isRTL ? 'المدة' : 'Duration', data.duration)
    if (data.cargo_type)    push(isRTL ? 'الشحنة'  : 'Cargo',    cargoTypeLabel[data.cargo_type] ?? data.cargo_type)
    push(isRTL ? 'الوجهات' : 'Destinations', data.destinations)
    if (data.payment_terms) push(isRTL ? 'الدفع'   : 'Payment',  paymentTermsLabel[data.payment_terms] ?? data.payment_terms)
  }

  // Jobs
  if (data.section === 'jobs') {
    push(isRTL ? 'المسمى الوظيفي' : 'Job title', data.job_title)
    if (data.employment_type) push(isRTL ? 'نوع التوظيف' : 'Employment', employmentTypeLabel[data.employment_type] ?? data.employment_type)
    push(isRTL ? 'سنوات الخبرة' : 'Experience', data.experience_years)
    if (data.license_required) push(isRTL ? 'الرخصة' : 'License', licenseLabel[data.license_required] ?? data.license_required)
    // Salary — a single row when both bounds exist, otherwise whatever we have
    if (data.salary_min && data.salary_max) {
      push(isRTL ? 'الراتب' : 'Salary',
        `${Number(data.salary_min).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} – ${Number(data.salary_max).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} ${isRTL ? 'ر.س' : 'SAR'}`)
    } else if (data.salary_min || data.salary_max) {
      const n = Number(data.salary_min || data.salary_max)
      push(isRTL ? 'الراتب' : 'Salary', `${n.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} ${isRTL ? 'ر.س' : 'SAR'}`)
    }
  }

  // M&A
  if (data.section === 'ma') {
    if (data.company_type)   push(isRTL ? 'نوع الشركة'      : 'Company',    companyTypeLabel[data.company_type] ?? data.company_type)
    push(isRTL ? 'عدد الموظفين'   : 'Employees', data.employees_count)
    push(isRTL ? 'الإيرادات السنوية' : 'Revenue', data.annual_revenue)
  }

  return specs
}

export default function ListingPreview({ data, previews, isRTL, userName }: Props) {
  const title = isRTL
    ? (data.title_ar || data.title_en || 'بدون عنوان')
    : (data.title_en || data.title_ar || 'No title')

  const specs = buildSpecs(data, isRTL)
  const typeMeta = data.listing_type ? listingTypeLabel[data.listing_type] : null
  const condMeta = data.section === 'fleet' && data.condition ? conditionLabel[data.condition] : null
  const forumMeta = data.section === 'forum' && data.forum_category ? forumCategoryLabel[data.forum_category] : null

  const priceDisplay = () => {
    if (data.price_type === 'on_request') return isRTL ? '💬 السعر عند الطلب' : '💬 Price on Request'
    if (!data.price) return null
    const formatted = Number(data.price).toLocaleString(isRTL ? 'ar-SA' : 'en-US')
    const suffix = isRTL ? 'ر.س' : 'SAR'
    const neg = data.price_type === 'negotiable'
      ? (isRTL ? ' (قابل للتفاوض)' : ' (Negotiable)') : ''
    return `${formatted} ${suffix}${neg}`
  }

  const priceStr = priceDisplay()

  return (
    <div className="max-w-md mx-auto">
      <p className="text-xs text-center text-gray-400 mb-3 font-medium uppercase tracking-wide">
        {isRTL ? 'معاينة الإعلان كما سيراها المشتري' : 'Buyer-view listing preview'}
      </p>

      <article className="card overflow-hidden border-2 border-emerald/30 shadow-lg">
        {/* Image / placeholder */}
        <div className="h-48 relative overflow-hidden">
          {previews[0]
            ? <img src={previews[0]} alt="" className="w-full h-full object-cover" />
            : <CategoryPlaceholder section={data.section} variant={data.listing_type} />}

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
        <div className="p-4 space-y-3">
          {/* Chips row — listing_type, condition, forum category */}
          {(typeMeta || condMeta || forumMeta) && (
            <div className="flex flex-wrap gap-1.5">
              {typeMeta && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeMeta.color}`}>
                  {isRTL ? typeMeta.ar : typeMeta.en}
                </span>
              )}
              {condMeta && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald-700">
                  {isRTL ? condMeta.ar : condMeta.en}
                </span>
              )}
              {forumMeta && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {isRTL ? forumMeta.ar : forumMeta.en}
                </span>
              )}
            </div>
          )}

          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2" dir={isRTL ? 'rtl' : 'ltr'}>
            {title}
          </h3>

          {data.description_ar && (
            <p className="text-xs text-gray-500 line-clamp-2" dir="rtl">
              {data.description_ar}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            {data.city && (
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {data.city}
                {data.region ? ` · ${data.region}` : ''}
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
          {priceStr && (
            <div className="text-lg font-black text-emerald-700 pt-1">
              {priceStr}
            </div>
          )}

          {/* Specs grid — every section-relevant field the user filled */}
          {specs.length > 0 && (
            <dl className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              {specs.map(s => (
                <div key={s.k} className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                  <dt className="text-[9.5px] text-gray-400 uppercase tracking-wider mb-0.5">{s.k}</dt>
                  <dd className="text-xs font-semibold text-gray-800 truncate" title={s.v}>{s.v}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Contact — only when opted in */}
          {data.contact_phone && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-2 border-t border-gray-100">
              <Phone size={12} />
              <span dir="ltr">{data.contact_phone}</span>
            </div>
          )}
          {data.contact_email && (
            <div className="text-[11px] text-emerald-700 font-medium" dir="ltr">
              ✉️ {data.contact_email}
            </div>
          )}
        </div>

        {/* Footer — enriched seller card so the preview mirrors what the
            buyer sees on the detail page (Day-4 fix). */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy/15 to-emerald/15
                          border border-navy/10 flex items-center justify-center
                          font-black text-navy text-sm shrink-0">
            {userName.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-800 truncate">{userName}</div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <Calendar size={9} />
              {isRTL ? 'عضو منذ 2026' : 'Member since 2026'}
            </div>
          </div>
          <span className="flex items-center gap-0.5 text-[9.5px] text-emerald font-semibold
                           bg-emerald/10 px-1.5 py-0.5 rounded-full shrink-0">
            <BadgeCheck size={10} /> {isRTL ? 'مؤكد' : 'Verified'}
          </span>
        </div>
      </article>
    </div>
  )
}
