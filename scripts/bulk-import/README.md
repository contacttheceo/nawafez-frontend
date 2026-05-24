# 📦 Bulk Import Listings — دليل سريع

أداة لرفع عشرات/مئات الإعلانات دفعة واحدة، مع توليد صور AI تلقائياً، وإنشاء حسابات مستخدمين جديدة عند الحاجة.

## 🎯 ما تفعله الأداة

1. **تقرأ ملف CSV** فيه كل بيانات الإعلانات + المستخدمين
2. **تُسجّل دخول** للمستخدم لو موجود، أو **تُسجّل حساب جديد** لو غير موجود
3. **تولّد صور AI** (Flux عبر Pollinations.ai — مجاناً، بدون API key)
4. **تنشئ كل إعلان** عبر API الـ backend بتوكن المستخدم نفسه

---

## 🚀 الاستخدام السريع

### الخطوة 1: انسخ القالب
```bash
cp scripts/bulk-import/templates/listings-template.csv my-listings.csv
```

### الخطوة 2: املأ بياناتك في Google Sheets
افتح [Google Sheets](https://sheets.google.com) → File → Import → ارفع `my-listings.csv` → عدّل/أضف صفوفك → File → Download → CSV.

### الخطوة 3: شغّل dry-run أولاً (بدون نشر فعلي)
```bash
node scripts/bulk-import/import.js my-listings.csv --dry-run
```
هذا يُظهر لك ما سيحدث دون أي تغيير على الإنتاج.

### الخطوة 4: نفّذ الحقيقي
```bash
node scripts/bulk-import/import.js my-listings.csv
```

شاهد التقدّم بألوان واضحة:
```
▶ [3/50]  fleet/sale — شاحنة مرسيدس أكتروس 2022
   [login OK]  ahmed.driver@example.com
   [image]     gen-3-0.jpg  (245KB)
   [image]     gen-3-1.jpg  (231KB)
✓ listing created — id=42, status=active
```

---

## 📊 شرح أعمدة الـ CSV

### معلومات المستخدم (تتكرّر لكل إعلان لنفس الشخص — السكريبت يعرف أنه نفسه عبر الـ email)
| العمود | إجباري | المعنى |
|---|---|---|
| `user_email` | ✅ | البريد الإلكتروني — مفتاح التعرّف |
| `user_name_ar` | ✅ للحساب الجديد | اسم بالعربي (للتسجيل أول مرة) |
| `user_name_en` | ✅ للحساب الجديد | اسم بالإنجليزي |
| `user_phone` | لا | جوال (اختياري) |
| `user_password` | ✅ | كلمة المرور — لازمة لتسجيل الدخول أيضاً |
| `user_role` | لا | `individual` (افتراضي) أو `business` |

### معلومات الإعلان
| العمود | إجباري | الـ values المقبولة |
|---|---|---|
| `section` | ✅ | `fleet` / `contracts` / `ma` / `jobs` / `forum` |
| `listing_type` | للأقسام إلا forum | fleet: `sale\|rent\|wanted` · contracts: `offer\|wanted` · jobs: `job\|job_seeker` · ma: `acquisition` · forum: `discussion` |
| `forum_category` | لو section=forum | `legal` / `financial` / `operational` / `logistics` |
| `title_ar` | ✅ | عنوان عربي |
| `title_en` | لا | عنوان إنجليزي |
| `description_ar` | ✅ | وصف عربي |
| `description_en` | لا | وصف إنجليزي |
| `city` | ✅ (إلا forum) | مدينة سعودية |
| `region` | لا | حي/منطقة |
| `price` | لا | السعر بالريال (أرقام فقط، بدون فواصل) |
| `price_type` | لا | `fixed` (افتراضي) / `negotiable` / `on_request` / `monthly` |
| `contact_phone` | لا | جوال للتواصل المباشر (واتساب) |
| `dynamic_data_json` | لا | JSON object بحقول خاصة بالقسم (مثال: vehicle_type, year, mileage) |
| `image_prompt` | لا | وصف الصورة بالإنجليزية لـ AI. لو فاضي → يُولّد تلقائياً من العنوان والقسم |
| `num_images` | لا | عدد الصور المراد توليدها (0-5). افتراضي 0 |

---

## 💡 نصائح مهمة

### 1. dynamic_data JSON
كل قسم له حقول مختلفة. أمثلة:

**Fleet**:
```json
{"vehicle_type":"truck","condition":"used","year":"2022","mileage":"80000","capacity":"30 طن"}
```
**Jobs**:
```json
{"job_title":"سائق ثقيل","employment_type":"full","experience_years":"3-5","salary_type":"fixed","salary_min":"5000","salary_max":"7000"}
```
**Contracts**:
```json
{"contract_type":"delivery","duration":"6 أشهر"}
```
**M&A**:
```json
{"company_type":"transport","employees_count":"10-50","annual_revenue":"5M ر.س"}
```

### 2. image_prompt للحصول على صور احترافية
- **استخدم الإنجليزية** — Flux يفهمها أفضل
- **كن وصفياً**: لون، إضاءة، خلفية، زاوية
- مثال جيد:
  > `Professional photo of white Mercedes Actros truck, 2022 model, parked at Saudi Arabia logistics yard, sunny day, no people, high quality`
- مثال سيء:
  > `truck`

### 3. تكلفة وأداء توليد الصور
- Pollinations.ai مجاني بالكامل، بدون API key
- كل صورة تأخذ 5-30 ثانية للتوليد
- 30 إعلان × 2 صور = 60 صورة ≈ 10-30 دقيقة إجمالي
- الصور تُحفظ في `scripts/bulk-import/output/` — لا تُولَّد مجدداً عند إعادة التشغيل (cached)

### 4. كلمات المرور
الـ script يحفظ token المستخدم مؤقتاً في الذاكرة فقط. لكن لازم تستخدم نفس `user_password` لكل إعلانات نفس المستخدم. كلمة المرور يجب أن تكون 8+ أحرف.

### 5. حالة الإعلانات بعد النشر
- إعلانات `fleet/contracts/jobs/forum` → `active` فوراً
- إعلانات `ma` → `pending_review` (تحتاج موافقة أدمن)

ادخل لوحة الإدارة → "الإعلانات" → فلتر "قيد المراجعة" → اعتمدها bulk.

---

## ❓ مشاكل شائعة

| المشكلة | الحل |
|---|---|
| `Register failed: email already taken` | الحساب موجود لكن كلمة المرور خاطئة. صحّحها في الـ CSV |
| `image attempt failed: timeout` | Pollinations بطيء أحياناً. السكريبت يعيد المحاولة تلقائياً |
| `POST /api/listings failed (422)` | حقل إجباري ناقص (تحقق من القسم: forum يحتاج forum_category، إلخ) |
| الإعلانات تظهر بدون صور | تحقق من `num_images > 0` وأن الـ image_prompt واضح |
| الـ pollinations يعيد صور غير مناسبة | حسّن الـ image_prompt: أضف وصف أوضح |

---

## 🔐 ملاحظات أمنية

- **لا تُلصق هذا السكريبت في chat عام** — يستخدم API الإنتاج
- **استخدم --dry-run أولاً** للتأكد قبل النشر الحقيقي
- **خذ نسخة احتياطية من DB** قبل أي batch كبير (`mysqldump` من phpMyAdmin)
- المستخدمون الجدد يُنشأون **بدون email verification** — هذه ميزة محل النقاش (راجع تحليلنا للأمان)

---

## 📝 مثال تشغيل كامل

```bash
# 1. انسخ القالب
cp scripts/bulk-import/templates/listings-template.csv my-real-listings.csv

# 2. حرّر my-real-listings.csv في Google Sheets

# 3. dry-run
node scripts/bulk-import/import.js my-real-listings.csv --dry-run

# 4. لو كل شيء OK
node scripts/bulk-import/import.js my-real-listings.csv

# 5. راجع النتائج على الموقع
open https://www.nwafizlogi.com/ar/listings
```
