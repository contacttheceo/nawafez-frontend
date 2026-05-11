import { NextRequest, NextResponse } from 'next/server';

// Allow up to 60 seconds for PDF analysis (Vercel Pro/Hobby default is 30s — adjust if needed)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('contract') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'لم يتم رفع ملف.' }, { status: 422 });
    }

    // Validate file type
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json(
        { message: 'يجب أن يكون الملف بصيغة PDF.' },
        { status: 422 }
      );
    }

    // Validate file size — max 10 MB
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

    // Convert PDF to base64 for Gemini's inline data
    const bytes = await file.arrayBuffer();
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
  "duration": "مدة العقد (مثال: سنة واحدة، 3 أشهر...)",
  "value": "القيمة المالية للعقد إن وُجدت أو null",
  "payment_terms": "شروط الدفع (دوري، شهري، عند التسليم...) أو null",
  "key_terms": [
    "أهم بند 1",
    "أهم بند 2",
    "أهم بند 3"
  ],
  "obligations": [
    {"party": "اسم الطرف", "obligation": "الالتزام المحدد"},
    {"party": "اسم الطرف", "obligation": "الالتزام المحدد"}
  ],
  "risks": [
    {"level": "high", "description": "خطر عالي: وصف واضح للخطر"},
    {"level": "medium", "description": "خطر متوسط: وصف واضح"},
    {"level": "low", "description": "خطر منخفض: وصف واضح"}
  ],
  "penalties": "الغرامات وعقوبات الإخلال إن وُجدت أو null",
  "termination_clauses": "شروط الإنهاء المبكر ومتطلباته أو null",
  "auto_renewal": true,
  "governing_law": "القانون المنظم والجهة القضائية المختصة أو null",
  "recommendations": [
    "توصية عملية 1 للمراجعة أو التحسين",
    "توصية عملية 2"
  ],
  "overall_risk": "low"
}

ملاحظات مهمة:
- إذا كانت المعلومة غير موجودة في العقد ضع null وليس نصاً وهمياً
- في حقل "overall_risk" ضع: "low" أو "medium" أو "high" بناءً على تقييمك الكلي للمخاطر
- في "auto_renewal" ضع true أو false أو null إذا لم يُذكر
- ركّز على الجوانب العملية التي تهم صاحب العمل في قطاع اللوجستيك السعودي
- إذا كان العقد بالإنجليزي، اكتب التحليل بالعربي مع ذكر المصطلحات الإنجليزية الرئيسية بين قوسين عند الحاجة`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'X-goog-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(55_000),
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      const errMsg = (errData as any)?.error?.message ?? `HTTP ${geminiRes.status}`;
      return NextResponse.json(
        { message: `خطأ في خدمة الذكاء الاصطناعي: ${errMsg}` },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const text: string =
      (geminiData as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Parse JSON from response
    let data: Record<string, unknown> | null = null;

    // 1. Strip markdown code blocks
    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    // 2. Try direct parse
    try {
      data = JSON.parse(stripped);
    } catch {
      /* continue */
    }

    // 3. Fallback: extract first JSON object
    if (!data) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          data = JSON.parse(match[0]);
        } catch {
          /* continue */
        }
      }
    }

    if (!data || !data.summary) {
      return NextResponse.json(
        {
          message: `فشل تحليل العقد. تأكد أن الملف يحتوي على نص قابل للقراءة.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';

    if (
      msg.toLowerCase().includes('timeout') ||
      msg.toLowerCase().includes('abort')
    ) {
      return NextResponse.json(
        { message: 'انتهت مهلة التحليل. جرب ملفاً أصغر حجماً.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { message: `خطأ في الخادم: ${msg}` },
      { status: 500 }
    );
  }
}
