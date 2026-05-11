import { NextRequest, NextResponse } from 'next/server';

// ── Level 1: System Instruction ──────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `أنت محلل بيانات متخصص في منصة نوافذ للخدمات اللوجستية في المملكة العربية السعودية.
تفهم السوق السعودي اللوجستي جيداً:

== شركات التوصيل المعروفة ==
نينجا، جاهز، كيتا، هنقر، هنقرستيشن، مرسول، أرامكس، DHL، فيدكس، زاجل، رسول، سمسا، توصيل، إيجكس، ناقل، إيمايل، نون، نون فود، كيمارت، نسك زمزم، ذيب، أمازون، بنك الجزيرة
- إذا ورد اسم شركة توصيل مع "سائق" أو "مندوب" → section=jobs, job_title=سائق توصيل
- إذا ورد اسم شركة توصيل مع "عقد" → section=contracts, contract_type=delivery
- "مندوب" أو "مناديب" = section=jobs, job_title=مندوب توصيل
- "مشغل" = section=jobs, job_title=مشغل أسطول
- "معقب" = section=jobs, job_title=معقب

== أنواع المركبات ==
- "دباب"، "دبابات"، "بوكسر"، "TVS"، "TVC"، "سويد"، "سيوم" = vehicle_type=motorcycle
- "دينة"، "دينا"، "ديناصور"، "شاص" = vehicle_type=truck
- "سطحة" = vehicle_type=truck
- "قلابة" = vehicle_type=truck
- "جوانب ألماني"، "ستارة" = vehicle_type=truck
- "دواكر"، "دوكر" = vehicle_type=bus
- "بيك آب"، "هايلوكس"، "بكب" = vehicle_type=pickup
- "مقطورة"، "تريلا" = vehicle_type=trailer
- "صهريج"، "ووتر تراك" = vehicle_type=tanker
- "مبردة"، "مبرد"، "ثلاجة"، "ثلج" = vehicle_type=refrigerator
- "سيارة"، "ديزاير"، "بيجاس"، "ايكو"، "ايكو فان"، "فيات ديبلو" = vehicle_type=car

== قواعد مهمة ==
- "لوحة صفراء" أو "لوح أصفر" أو "أصفار" = مركبة تجارية في section=fleet
- "لا يشترط الخبرة" أو "بدون خبرة" أو "خبرة غير مطلوبة" → experience_years="لا يشترط" (لا تضعها في missing)
- "خبرة 1-3 سنوات" → experience_years="1-3"، "خبرة 3-5" → experience_years="3-5"، "خبرة أكثر من 5" → experience_years="5+"
- "ذا شفز" = نظام شيفت في الوظيفة (ليس موقعاً ولا نوع مركبة)
- "نقل كفالة" = متطلب في إعلان وظيفة فقط (لا يؤثر على القسم)
- "مزاد" أو "السوم" أو "السعي ٢.٥٪" أو "للبيع مؤسسة" أو "للبيع شركة" → section=ma
- "مستودع" أو "مخزن" أو "مستودع مبرد" = contract_type=warehousing
- "المدينة" في السياق السعودي = "المدينة المنورة" (ليست اسم مدينة عامة)
- الأرقام مثل "٥٠٠٠" أو "5000" أو "خمسة آلاف" = رقم واحد
- "شامل" بعد الراتب = راتب شامل، ضعه في salary_min
- "مطلوب" في بداية النص = wanted (للأسطول والعقود)، أو job (للوظائف)

== تجاهل هذه الأنماط (ليست إعلانات) ==
- "كرت تشغيل" أو "تيوفي" أو "عقد أجير" أو "فحص دوري" وحدها بدون سياق بيع/شراء = خدمات امتثال إدارية → section=forum
- "حماية الأجور" أو "نطاق أحمر" = استفسارات نظامية → section=forum

مهمتك: استخراج بيانات الإعلان بدقة عالية.`;

// ── Level 1: Few-Shot Examples ────────────────────────────────────────────────
const FEW_SHOT_EXAMPLES = [
  {
    input:  'شاحنة مرسيدس أكتروس 2020 مستعملة حمولة 30 طن عداد 180 ألف كم أبيعها بـ 350 ألف ريال في الرياض',
    output: '{"section":"fleet","listing_type":"sale","fields":{"vehicle_type":"truck","year":"2020","mileage":"180000","capacity":"30","city":"الرياض","price":"350000"},"missing":["condition"]}',
  },
  {
    input:  'مطلوب 50 سائق توصيل للعمل في تطبيق نينجا والراتب 5000 ريال شامل للعمل في منطقة الرياض',
    output: '{"section":"jobs","listing_type":"job","fields":{"job_title":"سائق توصيل","employment_type":"full","salary_min":"5000","city":"الرياض"},"missing":["experience_years"]}',
  },
  {
    input:  'يوجد عقد كيتا معروض في جدة مدة 6 أشهر',
    output: '{"section":"contracts","listing_type":"offer","fields":{"contract_type":"delivery","duration":"6 أشهر","city":"جدة"},"missing":["price"]}',
  },
  {
    input:  'مطلوب سيارات بلوحة صفراء سوزوكي عدد 20 في منطقة الرياض',
    output: '{"section":"fleet","listing_type":"wanted","fields":{"vehicle_type":"car","city":"الرياض"},"missing":["year","price"]}',
  },
  {
    input:  'مطلوب سائق 50 للعمل في تطبيق هنقرستيشن براتب ثابت 5500 ريال شامل في منطقة الرياض لا يشترط الخبرة',
    output: '{"section":"jobs","listing_type":"job","fields":{"job_title":"سائق توصيل","employment_type":"full","salary_min":"5500","city":"الرياض","experience_years":"لا يشترط"},"missing":[]}',
  },
  {
    input:  'للإيجار مستودع مبرد في الدمام مساحة 500 متر إيجار شهري',
    output: '{"section":"contracts","listing_type":"offer","fields":{"contract_type":"warehousing","city":"الدمام","duration":"شهري"},"missing":["price"]}',
  },
  // ── Real-world examples from Saudi logistics WhatsApp groups ─────────────
  {
    input:  'متوفر تاجير كمية دراجات نارية لعقود الماركت وشركات التوصيل شامل تامين استلام فوري موديلات حديثة الرياض',
    output: '{"section":"fleet","listing_type":"rent","fields":{"vehicle_type":"motorcycle","city":"الرياض"},"missing":["price","year"]}',
  },
  {
    input:  'موجود دينات أصفار للإيجار موديل ٢٠٢٥ خمسة طن شاص',
    output: '{"section":"fleet","listing_type":"rent","fields":{"vehicle_type":"truck","year":"2025","capacity":"5"},"missing":["price","city"]}',
  },
  {
    input:  'موجود مؤسسة الرياض ترخيص دبابات ٢٥ دباب سويد ٢٤ كرت تشغيل عقد هنقرستيشن عقد جاهز بدون عمال بدون مديونيات',
    output: '{"section":"ma","listing_type":"sale","fields":{"company_type":"شركة توصيل دراجات","city":"الرياض"},"missing":["price"]}',
  },
  {
    input:  'مطلوب عقود شركات الطرود دايركت أمازون أرامكس نون إيجكس ناقل إيمايل اللي يعرف يفيدنا',
    output: '{"section":"contracts","listing_type":"wanted","fields":{"contract_type":"delivery"},"missing":["city","price"]}',
  },
  {
    input:  'مطلوب سائقين للعمل مع تطبيق نينجا براتب 2000 بسيارة الشركة أو 5000 بسيارتك توصيل طلبات مطاعم الرياض',
    output: '{"section":"jobs","listing_type":"job","fields":{"job_title":"سائق توصيل","employment_type":"full","salary_min":"2000","salary_max":"5000","city":"الرياض","experience_years":"لا يشترط"},"missing":[]}',
  },
];

// ── Level 2: JSON Schema ──────────────────────────────────────────────────────
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    section: {
      type: 'string',
      enum: ['fleet', 'contracts', 'jobs', 'forum', 'ma'],
    },
    listing_type: { type: 'string' },
    fields: {
      type: 'object',
      properties: {
        vehicle_type:    { type: 'string' },
        year:            { type: 'string' },
        mileage:         { type: 'string' },
        capacity:        { type: 'string' },
        city:            { type: 'string' },
        price:           { type: 'string' },
        job_title:       { type: 'string' },
        employment_type:  { type: 'string' },
        experience_years: { type: 'string' },
        salary_min:       { type: 'string' },
        salary_max:       { type: 'string' },
        contract_type:   { type: 'string' },
        duration:        { type: 'string' },
        company_type:    { type: 'string' },
        employees_count: { type: 'string' },
      },
    },
    missing: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['section', 'listing_type', 'fields', 'missing'],
};

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || String(text).trim().length < 5) {
      return NextResponse.json({ message: 'النص قصير جداً.' }, { status: 422 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'خدمة الذكاء الاصطناعي غير مفعّلة.' }, { status: 503 });
    }

    // Build few-shot conversation
    const fewShotContents = FEW_SHOT_EXAMPLES.flatMap((ex) => [
      { role: 'user',  parts: [{ text: ex.input  }] },
      { role: 'model', parts: [{ text: ex.output }] },
    ]);

    // Add the actual user query
    const contents = [
      ...fewShotContents,
      { role: 'user', parts: [{ text: String(text).trim() }] },
    ];

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'X-goog-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Level 1: System Instruction
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          // Level 1: Few-Shot + actual query
          contents,
          // Level 2: JSON Schema + settings
          generationConfig: {
            maxOutputTokens:  8192,
            temperature:      0,
            responseMimeType: 'application/json',
            responseSchema:   RESPONSE_SCHEMA,
          },
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      const errMsg  = (errData as any)?.error?.message ?? `HTTP ${geminiRes.status}`;
      return NextResponse.json({ message: `Gemini Error: ${errMsg}` }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const rawText: string = (geminiData as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Parse JSON
    let data: any = null;
    try { data = JSON.parse(rawText); } catch { /* continue */ }

    if (!data) {
      const start = rawText.indexOf('{');
      const end   = rawText.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try { data = JSON.parse(rawText.slice(start, end + 1)); } catch { /* continue */ }
      }
    }

    if (!data?.section) {
      return NextResponse.json(
        { message: `لم أتمكن من تحليل النص. الرد: ${rawText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    // Clean empty string values from fields
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.fields ?? {})) {
      if (v && String(v).trim()) fields[k] = String(v).trim();
    }

    return NextResponse.json({
      section:      data.section,
      listing_type: data.listing_type ?? '',
      fields,
      missing:      Array.isArray(data.missing) ? data.missing : [],
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: `Server Error: ${msg}` }, { status: 500 });
  }
}
