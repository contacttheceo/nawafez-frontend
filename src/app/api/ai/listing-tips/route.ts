import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractText, parseJsonResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { section, listing_type, dynamic_data, price, views_count, title_ar, has_images, city } = body;

    if (!section) {
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
    const sectionAr = sectionNames[section] ?? section;

    const dynamicText = dynamic_data && typeof dynamic_data === 'object'
      ? Object.entries(dynamic_data)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : '';

    const prompt = `أنت مستشار تحسين إعلانات متخصص في منصة نوافذ B2B اللوجستية السعودية.
حلّل هذا الإعلان وقدم 2-3 توصيات عملية ومحددة لتحسينه.

بيانات الإعلان:
- القسم: ${sectionAr}
- نوع الإعلان: ${listing_type ?? 'غير محدد'}
- العنوان: ${title_ar ?? 'غير محدد'}
- المدينة: ${city ?? 'غير محددة'}
- السعر: ${price ? `${Number(price).toLocaleString('ar-SA')} ر.س` : 'غير محدد'}
- المشاهدات: ${views_count ?? 0}
- صور: ${has_images ? 'نعم' : 'لا'}
- حقول إضافية: ${dynamicText || 'لا توجد'}

قواعد التقييم:
- بدون صور → تنبيه عالي
- بدون سعر → تنبيه عالي
- بدون مدينة → تنبيه عالي
- مشاهدات < 10 مع إعلان نشط > 3 أيام → اقترح تحسين العنوان
- حقول ناقصة (حمولة، موديل، سنة، إلخ) → اقترح إضافتها

أجب بصيغة JSON فقط بدون أي نص إضافي:
{
  "tips": [
    {"icon": "📸", "message": "نص التوصية الأولى", "priority": "high"},
    {"icon": "💰", "message": "نص التوصية الثانية", "priority": "medium"}
  ]
}

الأولويات: "high" لما يؤثر على ظهور الإعلان، "medium" لما يُحسّن التفاعل.
الأيقونات المتاحة: 📸 للصور، 💰 للسعر، 📍 للموقع، ✍️ للوصف، 📋 للحقول الناقصة، 👁️ للمشاهدات، ⚡ للعاجل.`;

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
    const data = parseJsonResponse(text) as { tips?: Array<{ icon: string; message: string; priority: string }> } | null;

    if (!data?.tips || !Array.isArray(data.tips)) {
      return NextResponse.json({ tips: [] });
    }

    return NextResponse.json({ tips: data.tips.slice(0, 3) });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: `Server Error: ${msg}` }, { status: 500 });
  }
}
