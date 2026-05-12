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

    const prompt = `أنت مستشار تحسين إعلانات خبير في منصة نوافذ B2B اللوجستية السعودية.
مهمتك: تقديم توصيات تحسين عملية ومحددة لهذا الإعلان.

بيانات الإعلان:
- القسم: ${sectionAr}
- نوع الإعلان: ${listing_type ?? 'غير محدد'}
- العنوان: ${title_ar ?? 'غير محدد'}
- المدينة: ${city ?? 'غير محددة'}
- السعر: ${price ? `${Number(price).toLocaleString('ar-SA')} ر.س` : 'غير محدد'}
- المشاهدات: ${views_count ?? 0}
- صور: ${has_images ? 'نعم' : 'لا'}
- حقول إضافية: ${dynamicText || 'لا توجد'}

تعليمات مهمة جداً:
1. يجب أن تُرجع دائماً بين 2 و 3 توصيات — لا تُرجع مصفوفة فارغة أبداً
2. حتى الإعلان الجيد يمكن تحسينه — ابحث دائماً عن فرص التحسين
3. كن محدداً وعملياً في توصياتك — لا توصيات عامة

معايير التقييم (من الأعلى أولوية للأدنى):
- بدون صور → priority: "high" — "أضف صوراً حقيقية لزيادة المصداقية وجذب المشترين"
- بدون سعر → priority: "high" — "حدد السعر لأن الإعلانات بسعر واضح تحصل على 3x تفاعل"
- بدون مدينة → priority: "high" — "أضف المدينة لظهور في نتائج البحث المحلي"
- مشاهدات < 20 → priority: "high" — "حسّن العنوان بإضافة تفاصيل جذابة"
- عنوان أقل من 30 حرف → priority: "medium" — "أضف تفاصيل للعنوان (الموديل، السنة، الحالة)"
- لا توصيف للحالة (جديد/مستعمل) → priority: "medium"
- المشاهدات < 50 → اقترح مشاركة الإعلان على واتساب
- دائماً اقترح: مراجعة السعر مقارنةً بالسوق، أو إضافة رقم واتساب للتواصل السريع
- إذا الإعلان يبدو مكتملاً، اقترح: تجديد الإعلان دورياً، أو إضافة عرض خاص

أجب بصيغة JSON فقط بدون أي نص إضافي:
{
  "tips": [
    {"icon": "📸", "message": "نص التوصية الأولى بالعربي", "priority": "high"},
    {"icon": "💰", "message": "نص التوصية الثانية بالعربي", "priority": "medium"},
    {"icon": "👁️", "message": "نص التوصية الثالثة بالعربي", "priority": "medium"}
  ]
}

الأيقونات المتاحة: 📸 للصور، 💰 للسعر، 📍 للموقع، ✍️ للوصف، 📋 للحقول، 👁️ للمشاهدات، ⚡ للعاجل، 📱 للتواصل، 🔄 للتجديد، 📊 للتسعير.`;

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
