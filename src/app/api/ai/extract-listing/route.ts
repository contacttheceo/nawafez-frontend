import { NextRequest, NextResponse } from 'next/server';

// ── Level 1: System Instruction ──────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `أنت محلل بيانات متخصص في منصة نوافذ للخدمات اللوجستية في المملكة العربية السعودية.
تفهم السوق السعودي اللوجستي جيداً:
- الشركات المعروفة: نينجا، جاهز، كيتا، أرامكس، DHL، فيدكس، زاجل، رسول، سمسا
- "كيتا" و"نينجا" و"جاهز" = شركات توصيل طلبات → contract_type=delivery أو section=jobs
- "بيك آب"، "هايلوكس" = vehicle_type=pickup
- "مقطورة"، "تريلا" = vehicle_type=trailer
- "صهريج"، "ووتر تراك" = vehicle_type=tanker
- "مبردة"، "ثلج" = vehicle_type=refrigerator
- الأرقام مثل "٥٠٠٠" أو "5000" أو "خمسة آلاف" = رقم واحد
- "شامل" بعد الراتب = راتب all-inclusive، ضعه في salary_min
- "مطلوب" في بداية النص = wanted (للأسطول والعقود)، أو job (للوظائف)
مهمتك: استخراج بيانات الإعلان بدقة عالية.`;

// ── Level 1: Few-Shot Examples ────────────────────────────────────────────────
const FEW_SHOT_EXAMPLES = [
  {
    input:  'شاحنة مرسيدس أكتروس 2020 مستعملة حمولة 30 طن عداد 180 ألف كم أبيعها بـ 350 ألف ريال في الرياض',
    output: '{"section":"fleet","listing_type":"for_sale","fields":{"vehicle_type":"truck","year":"2020","mileage":"180000","capacity":"30","city":"الرياض","price":"350000"},"missing":["condition"]}',
  },
  {
    input:  'مطلوب 50 سائق توصيل للعمل في تطبيق نينجا والراتب 5000 ريال شامل للعمل في منطقة الرياض',
    output: '{"section":"jobs","listing_type":"job","fields":{"job_title":"سائق توصيل","employment_type":"full","salary_min":"5000","city":"الرياض"},"missing":["experience_years"]}',
  },
  {
    input:  'يوجد عقد كيتا معروض في جدة مدة 6 أشهر',
    output: '{"section":"contracts","listing_type":"offering","fields":{"contract_type":"delivery","duration":"6 أشهر","city":"جدة"},"missing":["price"]}',
  },
  {
    input:  'مطلوب سيارات بلوحة صفراء سوزوكي عدد 20 في منطقة الرياض',
    output: '{"section":"fleet","listing_type":"wanted","fields":{"vehicle_type":"car","city":"الرياض"},"missing":["year","price"]}',
  },
  {
    input:  'للإيجار مستودع مبرد في الدمام مساحة 500 متر إيجار شهري',
    output: '{"section":"contracts","listing_type":"offering","fields":{"contract_type":"warehousing","city":"الدمام","duration":"شهري"},"missing":["price"]}',
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
        employment_type: { type: 'string' },
        salary_min:      { type: 'string' },
        salary_max:      { type: 'string' },
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
            maxOutputTokens:  1500,
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
