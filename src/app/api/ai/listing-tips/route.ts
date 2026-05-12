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

    const prompt = `أنت مستشار تحسين إعلانات لمنصة نوافذ B2B اللوجستية السعودية.

بيانات الإعلان:
- القسم: ${sectionAr}
- نوع الإعلان: ${listing_type ?? 'غير محدد'}
- العنوان: ${title_ar ?? 'غير محدد'}
- المدينة: ${city ?? 'غير محددة'}
- السعر: ${price ? `${Number(price).toLocaleString('ar-SA')} ر.س` : 'غير محدد'}
- المشاهدات: ${views_count ?? 0}
- صور: ${has_images ? 'نعم' : 'لا'}
- حقول إضافية: ${dynamicText || 'لا توجد'}

قاعدة أساسية: أرجع دائماً 2-3 توصيات — لا مصفوفة فارغة أبداً.

أولويات التقييم:
- بدون صور → "أضف صوراً حقيقية لزيادة المصداقية" (high)
- بدون سعر → "حدد السعر لأن الإعلانات بسعر واضح تحصل على 3x تفاعل" (high)
- بدون مدينة → "أضف المدينة للظهور في نتائج البحث المحلي" (high)
- مشاهدات < 20 → "حسّن العنوان بإضافة تفاصيل جذابة" (high)
- عنوان أقل من 30 حرف → "أضف تفاصيل للعنوان" (medium)
- مشاهدات < 50 → "شارك الإعلان على واتساب" (medium)
- إعلان مكتمل → "جدّد الإعلان دورياً" أو "أضف رقم واتساب" (medium)

أيقونات: 📸 صور، 💰 سعر، 📍 موقع، ✍️ وصف، 📋 حقول، 👁️ مشاهدات، ⚡ عاجل، 📱 تواصل، 🔄 تجديد، 📊 تسعير

IMPORTANT: Reply with RAW JSON only. No markdown, no code fences, no explanation.
{"tips":[{"icon":"📸","message":"...","priority":"high"},{"icon":"💰","message":"...","priority":"medium"}]}`;

    const { response, model } = await callGemini(
      apiKey,
      [{ text: prompt }],
      { maxOutputTokens: 512, temperature: 0.2, disableThinking: true },
      30_000
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg  = (errData as any)?.error?.message ?? `HTTP ${response.status}`;
      return NextResponse.json(
        { message: `خطأ في خدمة الذكاء الاصطناعي (${model}): ${errMsg}` },
        { status: 502 }
      );
    }

    const rawJson = await response.json();
    const text = extractText(rawJson);

    console.log('[listing-tips] model:', model);
    console.log('[listing-tips] raw text preview:', text.slice(0, 300));

    const data = parseJsonResponse(text) as { tips?: Array<{ icon: string; message: string; priority: string }> } | null;

    if (!data?.tips || !Array.isArray(data.tips)) {
      console.error('[listing-tips] failed to parse tips. text was:', text.slice(0, 500));
      return NextResponse.json({ tips: [], debug: `parse_failed: ${text.slice(0, 200)}` });
    }

    if (data.tips.length === 0) {
      console.warn('[listing-tips] AI returned empty tips array');
      return NextResponse.json({ tips: [], debug: 'empty_tips_from_ai' });
    }

    return NextResponse.json({ tips: data.tips.slice(0, 3) });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: `Server Error: ${msg}` }, { status: 500 });
  }
}
