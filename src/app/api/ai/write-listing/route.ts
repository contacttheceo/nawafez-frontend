import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { section, listing_type, fields } = body;

    if (!section || !fields || typeof fields !== 'object') {
      return NextResponse.json({ message: 'بيانات غير صحيحة.' }, { status: 422 });
    }

    // Remove empty values
    const filteredFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v && String(v).trim()) filteredFields[k] = String(v).trim();
    }

    if (Object.keys(filteredFields).length === 0) {
      return NextResponse.json(
        { message: 'أدخل بيانات الإعلان أولاً لكي يتمكن الذكاء الاصطناعي من الكتابة.' },
        { status: 422 }
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
    const typeText   = listing_type ? `نوع الإعلان: ${listing_type}` : '';
    const fieldsText = Object.entries(filteredFields)
      .map(([k, v]) => `${k}: ${v}`)
      .join('، ');

    const prompt = `أنت كاتب إعلانات محترف متخصص في قطاع اللوجستيك السعودي (نقل، مستودعات، توزيع، أسطول، عقود).
مهمتك: كتابة عنوان ووصف احترافي وجذاب لإعلان على منصة نوافذ B2B.

القسم: ${sectionAr}
${typeText}
بيانات الإعلان: ${fieldsText}

القواعد:
- العنوان بالعربي: قصير وجذاب، أقل من 80 حرف، يذكر أهم ميزة
- العنوان بالإنجليزي: ترجمة احترافية، أقل من 80 حرف
- الوصف بالعربي: 3-4 جمل احترافية، يبرز المميزات، يشجع على التواصل، بأسلوب B2B رسمي
- الوصف بالإنجليزي: ترجمة احترافية للوصف العربي
- لا تخترع بيانات غير موجودة في المعلومات المُعطاة
- الرد بصيغة JSON فقط بدون أي نص إضافي قبله أو بعده

{
  "title_ar": "...",
  "title_en": "...",
  "description_ar": "...",
  "description_en": "..."
}`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'خدمة الذكاء الاصطناعي غير مفعّلة حالياً.' }, { status: 503 });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent`,
      {
        method: 'POST',
        headers: {
          'X-goog-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 700, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      const errMsg  = errData?.error?.message ?? `HTTP ${geminiRes.status}`;
      return NextResponse.json({ message: `Gemini Error: ${errMsg}` }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const text: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Extract JSON block
    const match = text.match(/\{[\s\S]*?"title_ar"[\s\S]*?\}/);
    const data  = match ? JSON.parse(match[0]) : null;

    if (!data || !data.title_ar || !data.description_ar) {
      return NextResponse.json({ message: 'فشل تحليل رد الذكاء الاصطناعي، حاول مرة أخرى.' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: `Server Error: ${msg}` }, { status: 500 });
  }
}
