'use client';

import type { ListingSection } from '@/types';

interface Props {
  section: ListingSection;
  isRTL:   boolean;
  reg:     (name: string, opts?: object) => object; // react-hook-form register
  errors:  Record<string, any>;
  watch:   (name: string) => any;
}

const inputCls = 'input text-sm';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const errorCls = 'text-red-500 text-xs mt-0.5';

/* ── Reusable sub-components ─────────────────────────────────────── */
function RadioGroup({
  name, options, reg, isRTL, required,
}: {
  name: string;
  options: { value: string; labelAr: string; labelEn: string }[];
  reg: (name: string, opts?: object) => object;
  isRTL: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o.value}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200
                     cursor-pointer hover:border-emerald text-sm has-[:checked]:border-emerald
                     has-[:checked]:bg-emerald/5 transition">
          <input type="radio" value={o.value}
            {...(reg(name, required ? { required: true } : {}) as object)}
            className="accent-emerald" />
          <span>{isRTL ? o.labelAr : o.labelEn}</span>
        </label>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Fleet fields
════════════════════════════════════════════════════════════════════ */
function FleetFields({ isRTL, reg, errors }: Props) {
  return (
    <div className="space-y-5">
      {/* Listing type */}
      <div>
        <label className={labelCls}>{isRTL ? 'نوع الطرح *' : 'Listing Type *'}</label>
        <RadioGroup name="listing_type" isRTL={isRTL} reg={reg} required
          options={[
            { value: 'sale',    labelAr: '🏷️ للبيع',     labelEn: '🏷️ For Sale'   },
            { value: 'rent',    labelAr: '🔄 للإيجار',   labelEn: '🔄 For Rent'   },
            { value: 'wanted',  labelAr: '🔍 مطلوب',     labelEn: '🔍 Wanted'     },
          ]} />
        {errors.listing_type && <p className={errorCls}>{isRTL ? 'مطلوب' : 'Required'}</p>}
      </div>

      {/* Vehicle type */}
      <div>
        <label className={labelCls}>{isRTL ? 'نوع المركبة *' : 'Vehicle Type *'}</label>
        <select {...(reg('vehicle_type', { required: true }) as object)} className={inputCls}>
          <option value="">{isRTL ? 'اختر النوع' : 'Select type'}</option>
          {[
            ['truck',      'شاحنة',        'Truck'],
            ['semi',       'نصف نقل',      'Semi-Truck'],
            ['trailer',    'مقطورة',        'Trailer'],
            ['crane',      'رافعة',         'Crane'],
            ['tanker',     'صهريج',         'Tanker'],
            ['refrigerator','مبرّدة',       'Refrigerated'],
            ['pickup',      'بيك آب',        'Pickup'],
            ['car',         'سيارة',         'Car'],
            ['motorcycle',  'دراجة نارية',   'Motorcycle'],
            ['other',       'أخرى',          'Other'],
          ].map(([v, ar, en]) => (
            <option key={v} value={v}>{isRTL ? ar : en}</option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label className={labelCls}>{isRTL ? 'الحالة *' : 'Condition *'}</label>
        <RadioGroup name="condition" isRTL={isRTL} reg={reg} required
          options={[
            { value: 'new',  labelAr: '✨ جديد',    labelEn: '✨ New'      },
            { value: 'used', labelAr: '🔧 مستعمل', labelEn: '🔧 Used'     },
          ]} />
      </div>

      {/* Year + Mileage */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{isRTL ? 'سنة الصنع' : 'Year'}</label>
          <input type="number" min="1990" max={new Date().getFullYear()}
            {...(reg('year') as object)} className={inputCls}
            placeholder={String(new Date().getFullYear())} />
        </div>
        <div>
          <label className={labelCls}>{isRTL ? 'المسافة (كم)' : 'Mileage (km)'}</label>
          <input type="number" min="0"
            {...(reg('mileage') as object)} className={inputCls} placeholder="0" />
        </div>
      </div>

      {/* Capacity */}
      <div>
        <label className={labelCls}>{isRTL ? 'الحمولة (طن)' : 'Capacity (tons)'}</label>
        <input {...(reg('capacity') as object)} className={inputCls}
          placeholder={isRTL ? 'مثال: 30 طن' : 'e.g. 30 tons'} />
      </div>

      {/* Title + Description */}
      <TitleDescription isRTL={isRTL} reg={reg} errors={errors} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Contracts fields
════════════════════════════════════════════════════════════════════ */
function ContractsFields({ isRTL, reg, errors }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>{isRTL ? 'نوع الطرح *' : 'Type *'}</label>
        <RadioGroup name="listing_type" isRTL={isRTL} reg={reg} required
          options={[
            { value: 'offer',  labelAr: '📤 عقد معروض', labelEn: '📤 Offering Contract' },
            { value: 'wanted', labelAr: '📥 عقد مطلوب', labelEn: '📥 Seeking Contract'  },
          ]} />
      </div>

      <div>
        <label className={labelCls}>{isRTL ? 'نوع العقد *' : 'Contract Type *'}</label>
        <select {...(reg('contract_type', { required: true }) as object)} className={inputCls}>
          <option value="">{isRTL ? 'اختر النوع' : 'Select type'}</option>
          {[
            ['distribution', 'توزيع',       'Distribution'],
            ['transport',    'نقل بضائع',   'Freight Transport'],
            ['warehousing',  'تخزين',        'Warehousing'],
            ['lastmile',     'توصيل أخير',  'Last-Mile Delivery'],
            ['customs',      'تخليص جمركي', 'Customs Clearance'],
            ['other',        'أخرى',         'Other'],
          ].map(([v, ar, en]) => (
            <option key={v} value={v}>{isRTL ? ar : en}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>{isRTL ? 'مدة العقد' : 'Duration'}</label>
        <input {...(reg('duration') as object)} className={inputCls}
          placeholder={isRTL ? 'مثال: سنة، 6 أشهر' : 'e.g. 1 year, 6 months'} />
      </div>

      <TitleDescription isRTL={isRTL} reg={reg} errors={errors} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Jobs fields
════════════════════════════════════════════════════════════════════ */
function JobsFields({ isRTL, reg, errors, watch }: Props) {
  const salaryType = watch('salary_type');

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>{isRTL ? 'المسمى الوظيفي *' : 'Job Title *'}</label>
        <input {...(reg('job_title', { required: true }) as object)} className={inputCls}
          placeholder={isRTL ? 'مثال: سائق شاحنة، مدير مستودع' : 'e.g. Truck Driver, Warehouse Manager'} />
        {errors.job_title && <p className={errorCls}>{isRTL ? 'مطلوب' : 'Required'}</p>}
      </div>

      <div>
        <label className={labelCls}>{isRTL ? 'نوع التوظيف *' : 'Employment Type *'}</label>
        <RadioGroup name="employment_type" isRTL={isRTL} reg={reg} required
          options={[
            { value: 'full',     labelAr: 'دوام كامل',  labelEn: 'Full-time'  },
            { value: 'part',     labelAr: 'دوام جزئي',  labelEn: 'Part-time'  },
            { value: 'contract', labelAr: 'عقد مؤقت',   labelEn: 'Contract'   },
          ]} />
      </div>

      <div>
        <label className={labelCls}>{isRTL ? 'سنوات الخبرة' : 'Experience'}</label>
        <select {...(reg('experience_years') as object)} className={inputCls}>
          <option value="">{isRTL ? 'لا يشترط' : 'Any'}</option>
          <option value="1-3">{isRTL ? '1-3 سنوات' : '1-3 years'}</option>
          <option value="3-5">{isRTL ? '3-5 سنوات' : '3-5 years'}</option>
          <option value="5+">{isRTL ? 'أكثر من 5 سنوات' : '5+ years'}</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>{isRTL ? 'الراتب' : 'Salary'}</label>
        <RadioGroup name="salary_type" isRTL={isRTL} reg={reg}
          options={[
            { value: 'fixed',       labelAr: 'راتب ثابت',      labelEn: 'Fixed Salary'    },
            { value: 'negotiable',  labelAr: 'قابل للتفاوض',   labelEn: 'Negotiable'      },
            { value: 'on_request',  labelAr: 'عند الطلب',      labelEn: 'On Request'      },
          ]} />
      </div>

      {salaryType === 'fixed' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{isRTL ? 'الحد الأدنى (ر.س)' : 'Min Salary (SAR)'}</label>
            <input type="number" min="0" {...(reg('salary_min') as object)} className={inputCls} placeholder="3000" />
          </div>
          <div>
            <label className={labelCls}>{isRTL ? 'الحد الأقصى (ر.س)' : 'Max Salary (SAR)'}</label>
            <input type="number" min="0" {...(reg('salary_max') as object)} className={inputCls} placeholder="8000" />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>{isRTL ? 'عنوان الوظيفة *' : 'Job Listing Title *'}</label>
        <input {...(reg('title_ar', { required: true }) as object)} className={inputCls} dir="rtl"
          placeholder={isRTL ? 'مثال: مطلوب سائق شاحنة — الرياض' : ''} />
        {errors.title_ar && <p className={errorCls}>{isRTL ? 'مطلوب' : 'Required'}</p>}
      </div>

      <div>
        <label className={labelCls}>{isRTL ? 'متطلبات ووصف الوظيفة *' : 'Job Description *'}</label>
        <textarea {...(reg('description_ar', { required: true }) as object)}
          className={`${inputCls} min-h-[140px] resize-y`} dir="rtl"
          placeholder={isRTL ? 'اكتب متطلبات الوظيفة والمهام والمزايا…' : 'Describe requirements, duties, benefits…'} />
        {errors.description_ar && <p className={errorCls}>{isRTL ? 'مطلوب' : 'Required'}</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Forum fields
════════════════════════════════════════════════════════════════════ */
function ForumFields({ isRTL, reg, errors }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
        {isRTL
          ? '💬 المنتدى مخصص للنقاشات المهنية في مجال اللوجستيات. لا يلزم ذكر سعر أو موقع.'
          : '💬 Forum is for professional logistics discussions. Price & location are optional.'}
      </p>
      <TitleDescription isRTL={isRTL} reg={reg} errors={errors}
        descPlaceholderAr="اكتب سؤالك أو موضوع النقاش بالتفصيل…"
        descPlaceholderEn="Describe your question or discussion topic…" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   M&A fields
════════════════════════════════════════════════════════════════════ */
function MAFields({ isRTL, reg, errors }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
        {isRTL
          ? '⚠️ إعلانات الاستحواذ والدمج تخضع للمراجعة من الفريق قبل النشر (خلال 24 ساعة).'
          : '⚠️ M&A listings are reviewed by our team before publishing (within 24h).'}
      </p>

      <div>
        <label className={labelCls}>{isRTL ? 'نوع الشركة *' : 'Company Type *'}</label>
        <select {...(reg('company_type', { required: true }) as object)} className={inputCls}>
          <option value="">{isRTL ? 'اختر النوع' : 'Select type'}</option>
          {[
            ['transport',  'شركة نقل وشحن',    'Transport & Freight'],
            ['warehousing','خدمات تخزين',       'Warehousing'],
            ['tech',       'تقنية لوجستية',     'Logistics Tech'],
            ['customs',    'تخليص جمركي',       'Customs Brokerage'],
            ['fleet',      'إدارة أسطول',       'Fleet Management'],
            ['other',      'أخرى',              'Other'],
          ].map(([v, ar, en]) => (
            <option key={v} value={v}>{isRTL ? ar : en}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{isRTL ? 'عدد الموظفين' : 'Employees'}</label>
          <select {...(reg('employees_count') as object)} className={inputCls}>
            <option value="">{isRTL ? 'اختر' : 'Select'}</option>
            <option value="1-10">1-10</option>
            <option value="10-50">10-50</option>
            <option value="50-200">50-200</option>
            <option value="200+">200+</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>{isRTL ? 'الإيرادات السنوية (تقريبي)' : 'Annual Revenue (approx)'}</label>
          <input {...(reg('annual_revenue') as object)} className={inputCls}
            placeholder={isRTL ? 'مثال: 5M ر.س' : 'e.g. 5M SAR'} />
        </div>
      </div>

      <TitleDescription isRTL={isRTL} reg={reg} errors={errors}
        descPlaceholderAr="اشرح تفاصيل فرصة الاستحواذ، السبب، الشروط…"
        descPlaceholderEn="Describe the M&A opportunity, reason, terms…" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Shared: Title + Description
════════════════════════════════════════════════════════════════════ */
function TitleDescription({
  isRTL, reg, errors,
  descPlaceholderAr = 'اكتب وصفاً تفصيلياً للإعلان…',
  descPlaceholderEn = 'Describe your listing in detail…',
}: Pick<Props, 'isRTL' | 'reg' | 'errors'> & {
  descPlaceholderAr?: string;
  descPlaceholderEn?: string;
}) {
  return (
    <>
      <div>
        <label className={labelCls}>{isRTL ? 'العنوان بالعربية *' : 'Title (Arabic) *'}</label>
        <input {...(reg('title_ar', { required: true }) as object)} className={inputCls}
          dir="rtl" placeholder={isRTL ? 'عنوان واضح ومختصر' : 'Clear and concise title'} />
        {errors.title_ar && <p className={errorCls}>{isRTL ? 'مطلوب' : 'Required'}</p>}
      </div>

      <div>
        <label className={labelCls}>{isRTL ? 'العنوان بالإنجليزية (اختياري)' : 'Title (English, optional)'}</label>
        <input {...(reg('title_en') as object)} className={inputCls}
          dir="ltr" placeholder="English title" />
      </div>

      <div>
        <label className={labelCls}>{isRTL ? 'الوصف *' : 'Description *'}</label>
        <textarea {...(reg('description_ar', { required: true }) as object)}
          className={`${inputCls} min-h-[130px] resize-y`} dir="rtl"
          placeholder={isRTL ? descPlaceholderAr : descPlaceholderEn} />
        {errors.description_ar && <p className={errorCls}>{isRTL ? 'مطلوب' : 'Required'}</p>}
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Main export — renders the right fields
════════════════════════════════════════════════════════════════════ */
export default function SectionFields(props: Props) {
  switch (props.section) {
    case 'fleet':     return <FleetFields     {...props} />;
    case 'contracts': return <ContractsFields {...props} />;
    case 'jobs':      return <JobsFields      {...props} />;
    case 'forum':     return <ForumFields     {...props} />;
    case 'ma':        return <MAFields        {...props} />;
    default:          return null;
  }
}
