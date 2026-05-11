import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractText, parseJsonResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { section, listing_type, fields } = body;

    if (!section || !fields || typeof fields !== 'object') {
      return NextResponse.json({ message: 'بيانات غير صحيحة.' }, { status: 422 });
    }

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
    const typeText   = listing_type ? `نوع الإعلان: ${listing_type}` : '';
    const fieldsText = Object.entries(filteredFields).map(([k, v]) => `${k}: ${v}`).join('، ');

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

    const { response, model } = await callGemini(
      apiKey,
      [{ text: prompt }],
      { maxOutputTokens: 8192, temperature: 0.7 }
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
