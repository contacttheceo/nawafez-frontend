import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractText, parseJsonResponse } from '@/lib/gemini';

/* ─── Human-readable labels for raw field values ─────────────────── */
const VALUE_LABELS: Record<string, Record<string, string>> = {
  listing_type: {
    sale:    'للبيع',
    rent:    'للإيجار',
    wanted:  'مطلوب',
    offer:   'عقد معروض (نقدم الخدمة)',
    job:     'وظيفة',
    discussion: 'نقاش',
    acquisition: 'للاستحواذ',
  },
  vehicle_type: {
    truck:        'شاحنة',
    semi:         'نصف نقل (سيمي)',
    trailer:      'مقطورة',
    crane:        'رافعة',
    tanker:       'صهريج',
    refrigerator: 'مبرّدة',
    pickup:       'بيك آب',
    car:          'سيارة',
    motorcycle:   'دراجة نارية',
    other:        'أخرى',
  },
  condition: {
    new:  'جديد',
    used: 'مستعمل',
  },
  contract_type: {
    distribution: 'توزيع',
    transport:    'نقل بضائع',
    delivery:     'توصيل طلبات',
    warehousing:  'تخزين ومستودعات',
    lastmile:     'توصيل آخر ميل',
    customs:      'تخليص جمركي',
    other:        'أخرى',
  },
  company_type: {
    transport:   'شركة نقل وشحن',
    warehousing: 'خدمات تخزين',
    tech:        'تقنية لوجستية',
    customs:     'تخليص جمركي',
    fleet:       'إدارة أسطول',
    other:       'أخرى',
  },
  employment_type: {
    full:     'دوام كامل',
    part:     'دوام جزئي',
    contract: 'عقد مؤقت',
  },
  salary_type: {
    fixed:       'راتب ثابت',
    negotiable:  'قابل للتفاوض',
    on_request:  'عند الطلب',
  },
};

const FIELD_LABELS: Record<string, string> = {
  listing_type:     'نوع الطرح',
  vehicle_type:     'نوع المركبة',
  condition:        'الحالة',
  year:             'سنة الصنع',
  mileage:          'عدد الكيلومترات',
  capacity:         'الحمولة',
  contract_type:    'نوع العقد',
  duration:         'مدة العقد',
  company_type:     'نوع الشركة',
  employees_count:  'عدد الموظفين',
  annual_revenue:   'الإيرادات السنوية',
  job_title:        'المسمى الوظيفي',
  employment_type:  'نوع التوظيف',
  experience_years: 'سنوات الخبرة المطلوبة',
  salary_type:      'نوع الراتب',
  salary_min:       'الحد الأدنى للراتب',
  salary_max:       'الحد الأقصى للراتب',
  city:             'المدينة',
  price:            'السعر',
  price_type:       'نوع السعر',
  contact_phone:    'رقم التواصل',
  title_ar:         'العنوان المكتوب',
  description_ar:   'الوصف المكتوب',
};

function humanize(key: string, value: string): string {
  const label  = FIELD_LABELS[key] ?? key;
  const mapped = VALUE_LABELS[key]?.[value] ?? value;
  return `${label}: ${mapped}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { section, listing_type, fields, original_text } = body;

    if (!section || !fields || typeof fields !== 'object') {
      return NextResponse.json({ message: 'بيانات غير صحيحة.' }, { status: 422 });
    }

    // Skip title_ar/description_ar — they're what we're generating
    const filteredFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v && String(v).trim() && k !== 'title_ar' && k !== 'title_en' && k !== 'description_ar' && k !== 'description_en') {
        filteredFields[k] = String(v).trim();
      }
    }

    // Also include listing_type if not already in fields
    if (listing_type && !filteredFields.listing_type) {
      filteredFields.listing_type = listing_type;
    }

    if (Object.keys(filteredFields).length === 0) {
      return NextResponse.json(
        { message: 'أدخل بيانات الإعلان أولاً لكي يتمكن الذكاء الاصطناعي من الكتابة.' },
        { status: 422 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: 'خدمة الذكاء الاصطناعي غير مفعّلة حالياً.' },
        { status: 503 }
      );
    }

    const sectionNames: Record<string, string> = {
      fleet:     'أسطول مركبات لوجستية',
      contracts: 'عقود ومناقصات لوجستية',
      ma:        'استحواذ ودمج شركات لوجستية',
      jobs:      'وظائف في قطاع اللوجستيك',
      forum:     'منتدى نقاش لوجستي',
    };

    const sectionAr  = sectionNames[section] ?? section;
    const fieldsText = Object.entries(filteredFields)
      .map(([k, v]) => `• ${humanize(k, v)}`)
      .join('\n');

    // Build the context block: original text takes priority as it has the most detail
    const originalTextBlock = original_text?.trim()
      ? `النص الأصلي الذي كتبه المُعلِن (المصدر الرئيسي للمعلومات):\n"${original_text.trim()}"\n\n`
      : '';

    const prompt = `أنت كاتب إعلانات لمنصة نوافذ B2B اللوجستية السعودية.

المهمة: اكتب عنواناً ووصفاً لإعلان في قسم "${sectionAr}".

${originalTextBlock}البيانات المُستخرجة من النموذج:
${fieldsText}

⚠️ تعليمات صارمة جداً:
1. إذا وُجد "النص الأصلي" أعلاه — استخدمه كمصدر رئيسي واستخرج منه كل التفاصيل (أسماء شركات، أسعار، مدن، شروط)
2. اذكر أسماء الشركات والأرقام كما هي في النص (مثلاً: كيتا، أمازون، ٥ ريال/كم)
3. لا تخترع معلومات غير موجودة في النص أو الحقول
4. العنوان: قصير يذكر أهم تفصيلة (الشركة أو النوع أو السعر)
5. الوصف: 2-3 جمل تعكس التفاصيل الفعلية — إذا كانت البيانات قليلة، اجعل الوصف قصيراً
6. لا كلام تسويقي عام ("نضمن لك"، "خبرة واسعة") إلا إذا ذكرها المُعلِن
7. الرد بصيغة JSON فقط

{"title_ar":"...","title_en":"...","description_ar":"...","description_en":"..."}`;

    const { response, model } = await callGemini(
      apiKey,
      [{ text: prompt }],
      { maxOutputTokens: 4096, temperature: 0.2 }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg  = (errData as any)?.error?.message ?? `HTTP ${response.status}`;
      return NextResponse.json(
        { message: `خطأ في خدمة الذكاء الاصطناعي (${model}): ${errMsg}` },
        { status: 502 }
      );
    }

    const text = extractText(await response.json());
    const data = parseJsonResponse(text) as Record<string, string> | null;

    if (!data || !data.title_ar || !data.description_ar) {
      return NextResponse.json(
        { message: `فشل تحليل رد الذكاء الاصطناعي. الرد: ${text.slice(0, 200)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: `Server Error: ${msg}` }, { status: 500 });
  }
}
