import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractText, parseJsonResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { comments, listing_title, section } = body;

    if (!Array.isArray(comments) || comments.length < 5) {
      return NextResponse.json({ message: 'يجب أن يكون هناك 5 تعليقات على الأقل.' }, { status: 422 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'خدمة الذكاء الاصطناعي غير مفعّلة.' }, { status: 503 });
    }

    // Limit to 20 comments max to control token usage
    const sample = comments.slice(0, 20).join('\n- ');

    const sectionNames: Record<string, string> = {
      fleet:     'أسطول مركبات',
      contracts: 'عقود ومناقصات',
      ma:        'استحواذ ودمج شركات',
      jobs:      'وظائف لوجستية',
      forum:     'منتدى نقاش',
    };
    const sectionAr = sectionNames[section] ?? 'إعلان';

    const prompt = `أنت محلل تعليقات متخصص في منصة نوافذ B2B اللوجستية السعودية.
حلّل هذه التعليقات على الإعلان واستخرج أبرز 3 نقاط يسأل عنها الناس أو يناقشونها.

الإعلان: "${listing_title}"
القسم: ${sectionAr}

التعليقات:
- ${sample}

القواعد:
- كل نقطة جملة واحدة مختصرة وواضحة
- ركّز على الأسئلة والاهتمامات الحقيقية للمستخدمين
- لا تخترع نقاطاً غير موجودة في التعليقات
- الأسلوب: موضوعي ومحايد
- أجب بصيغة JSON فقط:

{"points": ["النقطة الأولى", "النقطة الثانية", "النقطة الثالثة"]}`;

    const { response, model } = await callGemini(
      apiKey,
      [{ text: prompt }],
      { maxOutputTokens: 512, temperature: 0.3 }
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
    const data = parseJsonResponse(text) as { points?: string[] } | null;

    if (!data?.points || !Array.isArray(data.points)) {
      return NextResponse.json({ points: [] });
    }

    return NextResponse.json({ points: data.points.slice(0, 3) });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: `Server Error: ${msg}` }, { status: 500 });
  }
}
