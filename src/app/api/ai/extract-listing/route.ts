import { NextRequest, NextResponse } from 'next/server';

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

    const prompt = `أنت محلل بيانات متخصص في قطاع اللوجستيك السعودي.
مهمتك: تحليل النص التالي واستخراج بيانات إعلان لوجستي بصيغة JSON دقيقة.

النص: "${String(text).trim()}"

القواعد:
1. section: اختر الأنسب من (fleet, contracts, jobs, forum, ma)
   - fleet = مركبات وشاحنات وسيارات
   - contracts = عقود ومناقصات وتوزيع
   - jobs = وظائف وتوظيف
   - forum = نقاشات وأسئلة
   - ma = استحواذ ودمج شركات

2. listing_type حسب القسم:
   - fleet: for_sale (للبيع) | for_rent (للإيجار) | wanted (مطلوب)
   - contracts: offering (معروض) | wanted (مطلوب)
   - jobs: job
   - forum: discussion
   - ma: acquisition

3. vehicle_type (للأسطول فقط): truck | semi | trailer | crane | tanker | refrigerator | pickup | car | motorcycle | other

4. المدن السعودية الصحيحة: الرياض، جدة، الدمام، مكة المكرمة، المدينة المنورة، الخبر، تبوك، أبها، ينبع، بريدة، حائل، نجران، الجوف، القصيم، الظهران

5. استخرج فقط ما هو صريح في النص — لا تخمّن
6. missing: قائمة بالحقول المهمة غير المذكورة في النص

أعد JSON فقط (بدون markdown) بهذا الشكل بالضبط:
{
  "section": "fleet",
  "listing_type": "for_sale",
  "fields": {
    "vehicle_type": "truck",
    "year": "2020",
    "mileage": "180000",
    "capacity": "10",
    "city": "الرياض",
    "price": "180000",
    "job_title": "",
    "employment_type": "",
    "contract_type": "",
    "company_type": ""
  },
  "missing": ["mileage", "capacity"],
  "summary_ar": "جملة قصيرة تصف الإعلان"
}`;

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'X-goog-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0, responseMimeType: 'application/json' },
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

    // Parse JSON — multiple strategies
    let data: any = null;

    // Strategy 1: strip markdown code fences then parse
    const stripped = rawText
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/m, '')
      .trim();
    try { data = JSON.parse(stripped); } catch { /* continue */ }

    // Strategy 2: find outermost { ... } block
    if (!data) {
      const start = rawText.indexOf('{');
      const end   = rawText.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try { data = JSON.parse(rawText.slice(start, end + 1)); } catch { /* continue */ }
      }
    }

    if (!data || !data.section) {
      return NextResponse.json(
        { message: `لم أتمكن من تحليل النص. الرد: ${rawText.slice(0, 300)}` },
        { status: 500 }
      );
    }

    // Clean empty string values from fields
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.fields ?? {})) {
      if (v && String(v).trim()) fields[k] = String(v).trim();
    }

    return NextResponse.json({
      section:      data.section ?? 'fleet',
      listing_type: data.listing_type ?? '',
      fields,
      missing:      Array.isArray(data.missing) ? data.missing : [],
      summary_ar:   data.summary_ar ?? '',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: `Server Error: ${msg}` }, { status: 500 });
  }
}
