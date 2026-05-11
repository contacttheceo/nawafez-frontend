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

    const prompt = `حلل النص وأعد JSON فقط بدون أي نص إضافي.

النص: "${String(text).trim()}"

القواعد:
- section: fleet(مركبات) | contracts(عقود) | jobs(وظائف) | forum(نقاش) | ma(استحواذ)
- listing_type: fleet→(for_sale|for_rent|wanted) contracts→(offering|wanted) jobs→job forum→discussion ma→acquisition
- fields: أضف فقط الحقول الموجودة في النص، احذف الفارغة
- الحقول الممكنة: vehicle_type, year, mileage, capacity, city, price, job_title, employment_type, salary_min, salary_max, contract_type, duration, company_type, employees_count
- vehicle_type: truck|semi|trailer|crane|tanker|refrigerator|pickup|car|motorcycle|other
- المدن: الرياض|جدة|الدمام|مكة المكرمة|المدينة المنورة|الخبر|تبوك|أبها|ينبع|بريدة
- missing: الحقول المهمة غير الموجودة في النص (2-3 فقط)

{"section":"...","listing_type":"...","fields":{"city":"..."},"missing":["price"]}`;

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
          generationConfig: { maxOutputTokens: 2000, temperature: 0, responseMimeType: 'application/json' },
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
