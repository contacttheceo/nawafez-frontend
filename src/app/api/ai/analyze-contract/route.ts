import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractText, parseJsonResponse } from '@/lib/gemini';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('contract') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'لم يتم رفع ملف.' }, { status: 422 });
    }

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return NextResponse.json({ message: 'يجب أن يكون الملف بصيغة PDF.' }, { status: 422 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت.' },
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

    const bytes  = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const prompt = `أنت محلل عقود قانوني ومالي متخصص في قطاع اللوجستيك والنقل في المملكة العربية السعودية.

حلّل هذا العقد بدقة وأعطني ملخصاً شاملاً ومفيداً باللغة العربية.

أجب بصيغة JSON فقط بدون أي نص إضافي قبله أو بعده:

{
  "summary": "ملخص موجز للعقد في 2-3 جمل يوضح طبيعته وأطرافه وهدفه الرئيسي",
  "contract_type": "نوع العقد بدقة (مثال: عقد توزيع بضائع، عقد نقل، عقد تخزين ومستودعات، عقد خدمات لوجستية، عقد عمل...)",
  "parties": [
    {"name": "اسم الطرف الأول", "role": "دوره في العقد"},
    {"name": "اسم الطرف الثاني", "role": "دوره في العقد"}
  ],
  "duration": "مدة العقد (مثال: سنة واحدة، 3 أشهر...) أو null",
  "value": "القيمة المالية للعقد إن وُجدت أو null",
  "payment_terms": "شروط الدفع (دوري، شهري، عند التسليم...) أو null",
  "key_terms": ["أهم بند 1", "أهم بند 2", "أهم بند 3"],
  "risks": [
    {"level": "high", "description": "وصف واضح للخطر العالي"},
    {"level": "medium", "description": "وصف واضح للخطر المتوسط"},
    {"level": "low", "description": "وصف واضح للخطر المنخفض"}
  ],
  "penalties": "الغرامات وعقوبات الإخلال إن وُجدت أو null",
  "termination_clauses": "شروط الإنهاء المبكر ومتطلباته أو null",
  "recommendations": ["توصية عملية 1", "توصية عملية 2"],
  "overall_risk": "low"
}

ملاحظات:
- إذا كانت المعلومة غير موجودة ضع null وليس نصاً وهمياً
- في "overall_risk" ضع: "low" أو "medium" أو "high"
- ركّز على الجوانب العملية التي تهم صاحب العمل في قطاع اللوجستيك السعودي`;

    const { response, model } = await callGemini(
      apiKey,
      [
        { inlineData: { mimeType: 'application/pdf', data: base64 } },
        { text: prompt },
      ],
      { maxOutputTokens: 8192, temperature: 0.1 },
      55_000
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
    const data = parseJsonResponse(text);

    if (!data || !data.summary) {
      return NextResponse.json(
        { message: 'فشل تحليل العقد. تأكد أن الملف يحتوي على نص قابل للقراءة.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('abort')) {
      return NextResponse.json(
        { message: 'انتهت مهلة التحليل. جرب ملفاً أصغر حجماً.' },
        { status: 504 }
      );
    }
    return NextResponse.json({ message: `خطأ في الخادم: ${msg}` }, { status: 500 });
  }
}
