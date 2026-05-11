import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractText, parseJsonResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listing_title, listing_section, listing_type, last_messages, is_buyer } = body;

    if (!listing_title || !Array.isArray(last_messages)) {
      return NextResponse.json({ message: 'بيانات غير صحيحة.' }, { status: 422 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: 'خدمة الذكاء الاصطناعي غير مفعّلة.' }, { status: 503 });
    }

    const sectionNames: Record<string, string> = {
      fleet:     'أسطول مركبات',
      contracts: 'عقود ومناقصات',
      ma:        'استحواذ ودمج شركات',
      jobs:      'وظائف لوجستية',
      forum:     'منتدى نقاش',
    };
    const sectionAr = sectionNames[listing_section] ?? listing_section ?? 'إعلان';
    const role      = is_buyer
      ? 'أنت المشتري/المهتم بالإعلان'
      : 'أنت صاحب الإعلان (البائع/المعلِن)';

    const conversationText = last_messages.length > 0
      ? last_messages.slice(-6).join('\n')
      : '(بداية المحادثة — لا توجد رسائل سابقة)';

    const prompt = `أنت مساعد محترف في منصة نوافذ B2B اللوجستية السعودية.
مهمتك: اقتراح 3 ردود قصيرة واحترافية للمستخدم في محادثة تجارية.

السياق:
- الإعلان: "${listing_title}"
- القسم: ${sectionAr}
- ${role}

آخر رسائل المحادثة:
${conversationText}

القواعد:
- كل اقتراح ردًّا واحدًا قصيرًا (1-2 جملة فقط)
- الأسلوب: مهني ولطيف ومباشر (أسلوب B2B سعودي)
- اقتراحات متنوعة: سؤال عن السعر، طلب تفاصيل إضافية، تأكيد الاهتمام، أو تحديد موعد
- لا تكرر نفس النوع في الاقتراحات الثلاثة
- الرد بصيغة JSON فقط بدون أي نص إضافي

{"suggestions": ["الاقتراح الأول", "الاقتراح الثاني", "الاقتراح الثالث"]}`;

    const { response, model } = await callGemini(
      apiKey,
      [{ text: prompt }],
      { maxOutputTokens: 512, temperature: 0.8 }
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
    const data = parseJsonResponse(text) as { suggestions?: string[] } | null;

    if (!data?.suggestions || !Array.isArray(data.suggestions) || data.suggestions.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    return NextResponse.json({ suggestions: data.suggestions.slice(0, 3) });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: `Server Error: ${msg}` }, { status: 500 });
  }
}
