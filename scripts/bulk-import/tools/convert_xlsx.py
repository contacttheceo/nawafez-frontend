#!/usr/bin/env python3
"""
يحوّل ملف Excel الحقيقي إلى CSV بصيغة scripts/bulk-import/import.js
— مع حماية كاملة للخصوصية —

✓ كل الـ 60 إعلان يُنشر تحت حساب واحد (افتراضياً: opportunities@nwafizlogi.com)
✓ يُمحى كل رقم جوال من العناوين والأوصاف
✓ يُمحى كل إيميل من النصوص
✓ يُستخدم رقم جوال موحّد (يُمرَّر بـ --phone) لـ contact_phone
✓ بدون أي بيانات شخصية أصلية في الإعلانات

الاستخدام:
  python3 scripts/bulk-import/tools/convert_xlsx.py \\
    --phone "+966556716705" \\
    --owner-email "opportunities@nwafizlogi.com" \\
    --owner-name "نوافذ - فرص السوق" \\
    --limit 60
"""

import argparse
import csv
import json
import re
import secrets
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("❌ pandas مطلوب. شغّل: pip3 install pandas openpyxl", file=sys.stderr)
    sys.exit(1)


# ─────────── إزالة PII (الخطوة الأهم) ───────────
# تحويل الأرقام الهندية إلى أرقام إنجليزية
ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

# Saudi phone patterns (بكل الصيغ المحتملة)
PHONE_PATTERNS = [
    r"\+?9665\d{8}",                            # +966 5XXXXXXXX
    r"\+?9660?5\d{8}",                          # +966 0 5XX (مع صفر زائد)
    r"\b00966\d{9,10}\b",
    r"\b05\d{8}\b",                             # 05XXXXXXXX
    r"\b5\d{8}\b",                              # 5XXXXXXXX (9 أرقام)
    r"\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b",       # XXX XXX XXXX (أي 10 أرقام مفصولة)
    r"\b\d{4}[\s\-]?\d{3}[\s\-]?\d{3}\b",       # XXXX XXX XXX
    r"\b0?5\d{2}[\s\-]?\d{3}[\s\-]?\d{3}\b",    # 05XX XXX XXX
    r"\b\d{9,}\b",                              # أي 9 أرقام متتالية كحل أخير
]

EMAIL_PATTERN = r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"


def scrub_pii(text: str) -> str:
    """يمحو كل رقم جوال وإيميل من النص — بكل الصيغ الممكنة."""
    if not text:
        return ""
    # ١. وحّد الأرقام (الهندية → الإنجليزية)
    s = text.translate(ARABIC_DIGITS)
    # ٢. احذف الإيميلات
    s = re.sub(EMAIL_PATTERN, "[تم حذف الإيميل]", s)
    # ٣. احذف الجوالات (كل الصيغ)
    for pat in PHONE_PATTERNS:
        s = re.sub(pat, "", s)
    # ٤. احذف أرقام منفصلة بالمسافات/الشرطات بنمط 4+3+3 أو 3+4+3 إلخ
    s = re.sub(r"\b(?:\d[\s\-]?){8,}\d\b", "", s)
    # ٥. نظّف المسافات الزائدة
    s = re.sub(r"\s+", " ", s).strip()
    # ٦. احذف emojis وعلامات تواصل غير ضرورية
    s = re.sub(r"[*•▪◾✅✔️🌹❤️🔻🔴⬅️➡️📱☎️📞🔵🟢⚫⚪]+", "", s).strip()
    # ٧. احذف عبارات "للتواصل" المتبوعة بـ ... (أصبحت فارغة بعد حذف الأرقام)
    s = re.sub(r"(للتواصل|التواصل|واتس|واتساب|اتصال|للحجز|للاستفسار)[:\s\-]*[\s\.]*$", "", s).strip()
    s = re.sub(r"\(\s*\)", "", s)  # أقواس فارغة
    return s


# ─────────── تصنيف الفئة العربية → section ───────────
def classify(cat_ar: str, need_text: str = "", side: str = "offer") -> tuple[str, str]:
    """يُرجع (section, listing_type). side = 'offer' أو 'demand'."""
    c = (cat_ar or "").strip().lower()
    n = (need_text or "").strip().lower()
    blob = c + " " + n

    if "بيع كيان" in blob or "شراكة" in blob or "شراء كيان" in blob:
        return ("ma", "acquisition")

    if any(k in blob for k in ["تأجير أسطول", "بيع أصول", "مبيعات أسطول",
                                 "أسطول للتشغيل", "سيارات للبيع", "بيع مستلزمات",
                                 "تأجير سكن", "تأجير مقار"]):
        if "بيع" in blob or "مبيعات" in blob or "سيارات للبيع" in blob:
            return ("fleet", "sale")
        return ("fleet", "rent")
    if "استئجار أسطول" in blob or "شراء أصول" in blob or "استئجار مقار" in blob:
        return ("fleet", "wanted")

    if any(k in blob for k in ["استقدام", "توظيف", "كادر بشري", "مناديب",
                                 "تنازل عن عمالة", "موظف", "مندوب"]):
        if side == "offer":
            return ("jobs", "job_seeker")
        return ("jobs", "job")

    if any(k in blob for k in ["عقد", "عقود", "مقاول", "نقل / شحنات",
                                 "نقل وشحن", "يبحث عن عقد", "خدمات تشغيلية"]):
        if "يبحث عن" in blob or "يطلب" in blob or side == "demand":
            return ("contracts", "wanted")
        return ("contracts", "offer")

    if any(k in blob for k in ["استشارة", "استشارات", "قانوني", "ضريبي", "مالية",
                                 "تمويل", "محاسب"]):
        return ("forum", "discussion")
    if any(k in blob for k in ["معقب", "تعقيب", "تأمين", "سعودة", "تراخيص",
                                 "خدمات", "تتبع"]):
        return ("forum", "discussion")

    return ("forum", "discussion")


def forum_cat(cat_ar: str, text: str = "") -> str:
    blob = (cat_ar + " " + text).lower()
    if any(k in blob for k in ["قانوني", "تراخيص", "ترخيص", "محامي", "نظامي"]):
        return "legal"
    if any(k in blob for k in ["مالية", "ضريبي", "تمويل", "محاسبي", "زكاة"]):
        return "financial"
    if any(k in blob for k in ["معقب", "تعقيب", "تأمين", "سعودة", "استقدام", "موظف", "خدمات"]):
        return "operational"
    return "logistics"


SAUDI_CITIES = {
    "الرياض": "الرياض", "جدة": "جدة", "مكة": "مكة المكرمة",
    "المدينة": "المدينة المنورة", "الدمام": "الدمام", "الخبر": "الخبر",
    "الظهران": "الظهران", "تبوك": "تبوك", "أبها": "أبها",
    "خميس مشيط": "خميس مشيط", "حائل": "حائل", "بريدة": "بريدة",
    "الطائف": "الطائف", "ينبع": "ينبع", "الجبيل": "الجبيل",
    "الأحساء": "الأحساء", "نجران": "نجران", "جازان": "جازان",
}


def normalize_city(s, section: str = "") -> str:
    """ترجع مدينة سعودية صالحة. للـ forum نرجع المملكة لأنها استشارات عامة."""
    if section == "forum":
        return "المملكة العربية السعودية"  # forum = نقاش عام
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return "الرياض"
    s = str(s).strip()
    if not s or s == "غير محدد":
        return "الرياض"
    for k, v in SAUDI_CITIES.items():
        if k in s:
            return v
    return s if len(s) < 30 else "الرياض"


def short_title(text: str, category: str, max_len: int = 80) -> str:
    text = scrub_pii(text)
    parts = re.split(r"[.!؟،\n]", text, maxsplit=1)
    first = parts[0].strip() if parts else text
    if len(first) > max_len:
        first = first[:max_len].rsplit(" ", 1)[0] + "..."
    if not first or len(first) < 10 or "غير محدد" in first or first == category:
        # حاول من الجملة الثانية
        parts = re.split(r"[.!؟،\n]", text)
        for p in parts:
            p = p.strip()
            if 15 <= len(p) <= max_len and "غير محدد" not in p:
                return p
        return category if category and "غير محدد" not in category else "فرصة لوجستية"
    return first


def gen_en_title(category: str) -> str:
    mapping = {
        "تأجير أسطول": "Fleet rental available",
        "بيع أصول": "Assets for sale",
        "بيع أصول (أسطول)": "Fleet assets for sale",
        "بيع أصول (سيارات)": "Vehicles for sale",
        "استئجار أسطول": "Fleet rental wanted",
        "خدمات (معقب)": "Government liaison services",
        "خدمات تشغيلية": "Operational services",
        "عقود تشغيلية": "Operational contract available",
        "يبحث عن عقد": "Seeking operational contract",
        "نقل / شحنات": "Transport & shipping",
        "بيع كيان": "Business for sale",
        "بيع كيان (دراجات)": "Bike-delivery business for sale",
        "شراء كيان": "Looking to acquire business",
        "كادر بشري (موظف)": "Workforce available",
        "توظيف / مناديب": "Hiring delivery drivers",
        "توظيف كادر": "Hiring staff",
        "استقدام وتوظيف": "Recruitment & hiring services",
        "تنازل عن عمالة": "Workforce transfer",
        "استشارة": "Consultation",
        "استشارات قانونية": "Legal consultation",
        "خدمات قانونية": "Legal services",
        "خدمات (تأمين)": "Insurance services",
        "خدمات (سعودة)": "Saudization services",
        "خدمات (تراخيص)": "Licensing services",
        "تمويل (أسطول)": "Fleet financing",
    }
    return mapping.get(category, "Saudi logistics opportunity")


# ─────────── قراءة الـ Excel ───────────
def read_offers(path: Path) -> list[dict]:
    df = pd.read_excel(path, sheet_name="قاعدة بيانات العروض")
    rows = []
    for _, r in df.iterrows():
        text = scrub_pii(str(r["النص الكامل للإعلان"]) if not pd.isna(r["النص الكامل للإعلان"]) else "")
        details = scrub_pii(str(r["التفاصيل التشغيلية"]) if not pd.isna(r["التفاصيل التشغيلية"]) else "")
        if not text or len(text) < 20:
            continue
        cat = str(r["التصنيف"]).strip() if not pd.isna(r["التصنيف"]) else ""
        section, ltype = classify(cat, text, side="offer")
        title_ar = short_title(details or text, cat)
        rows.append({
            "cat": cat,
            "city": normalize_city(r["المدينة/الموقع"], section),
            "details": details,
            "text": text,
            "cost": scrub_pii(str(r["التكلفة"])) if not pd.isna(r["التكلفة"]) else "",
            "section": section,
            "listing_type": ltype,
            "side": "offer",
            "title_ar": title_ar,
        })
    return rows


def read_demands(path: Path) -> list[dict]:
    df = pd.read_excel(path, sheet_name="قاعدة بيانات الطلبات", header=0)
    rows = []
    for _, r in df.iterrows():
        vals = r.values
        if len(vals) < 11:
            continue
        # 0=ref, 1=date, 2=source, 3=name, 4=phone, 5=need_type,
        # 6=city, 7=specs, 8=budget, 9=status, 10=text
        need = scrub_pii(str(vals[5]) if not pd.isna(vals[5]) else "")
        city_raw = vals[6]
        specs = scrub_pii(str(vals[7]) if not pd.isna(vals[7]) else "")
        text = scrub_pii(str(vals[-1]) if not pd.isna(vals[-1]) else "")

        if not text or len(text) < 20:
            continue

        section, _ = classify(need, text, side="demand")
        ltype_map = {
            "fleet": "wanted", "contracts": "wanted",
            "ma": "acquisition", "jobs": "job", "forum": "discussion",
        }
        ltype = ltype_map[section]
        title_ar = short_title(specs or text, need)
        rows.append({
            "cat": need,
            "city": normalize_city(city_raw, section),
            "details": specs,
            "text": text,
            "cost": "",
            "section": section,
            "listing_type": ltype,
            "side": "demand",
            "title_ar": title_ar,
        })
    return rows


# ─────────── بناء صفوف الـ CSV (كلها لمستخدم واحد) ───────────
def to_csv_row(item: dict, owner: dict, contact_phone: str) -> dict:
    section = item["section"]
    title_ar = item["title_ar"]
    title_en = gen_en_title(item["cat"])

    # دمج التفاصيل والنص — مع scrub إضافي للتأكيد
    desc_parts = [item["details"]] if item["details"] else []
    if item["text"] and item["text"] != item["details"]:
        desc_parts.append(item["text"])
    description_ar = scrub_pii(" \n\n".join(desc_parts))[:2000].strip()
    if not description_ar or len(description_ar) < 20:
        description_ar = title_ar
    description_en = f"Saudi logistics market opportunity. Category: {item['cat']}. Full Arabic description above."

    price = ""
    price_type = "on_request"
    cost = item.get("cost", "")
    m = re.search(r"(\d{2,7})", cost.replace(",", ""))
    if m and 100 <= int(m.group(1)) < 10_000_000:
        price = m.group(1)
        price_type = "fixed" if "تأ" not in cost else "monthly"

    fcat = forum_cat(item["cat"], item["text"]) if section == "forum" else ""

    # default listing_type لو فاضي
    ltype = item["listing_type"]
    if not ltype:
        ltype = {"jobs": "job", "forum": "discussion", "ma": "acquisition"}.get(section, "")

    dyn = {}
    if section == "fleet":
        dyn["vehicle_type"] = "truck" if "ثقيل" in item["text"] or "شاحنة" in item["text"] else "car"
        dyn["condition"] = "used"
    elif section == "jobs":
        dyn["job_title"] = title_ar[:50]
        dyn["employment_type"] = "full"
    elif section == "contracts":
        dyn["contract_type"] = "operational"
    elif section == "ma":
        dyn["company_type"] = "logistics"

    return {
        "user_email": owner["email"],
        "user_name_ar": owner["name_ar"],
        "user_name_en": owner["name_en"],
        "user_phone": owner["phone"],
        "user_password": owner["password"],
        "user_role": owner["role"],
        "section": section,
        "listing_type": ltype,
        "forum_category": fcat,
        "title_ar": title_ar,
        "title_en": title_en,
        "description_ar": description_ar,
        "description_en": description_en,
        "city": item["city"],
        "region": "",
        "price": price,
        "price_type": price_type,
        "contact_phone": contact_phone,    # ← رقم المالك الموحّد فقط
        "dynamic_data_json": json.dumps(dyn, ensure_ascii=False),
        "image_prompt": "",
        "num_images": 0,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="/Users/akrameltahir/Downloads/بيانات التسويق والصفقات - لوجستي السعوديه.xlsx")
    ap.add_argument("--output", default=None)
    ap.add_argument("--limit", type=int, default=60)
    ap.add_argument("--no-limit", action="store_true")
    ap.add_argument("--phone", default="+966556716705",
                    help="رقم جوال موحّد لكل الإعلانات (contact_phone). فارغ للحذف")
    ap.add_argument("--owner-email", default="opportunities@nwafizlogi.com")
    ap.add_argument("--owner-name", default="نوافذ - فرص السوق")
    ap.add_argument("--owner-name-en", default="Nawafez - Market Opportunities")
    ap.add_argument("--owner-password", default=None,
                    help="فارغ → يُولَّد عشوائياً ويُطبَع بعد الانتهاء")
    args = ap.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"❌ الملف غير موجود: {in_path}", file=sys.stderr)
        sys.exit(1)
    out_path = Path(args.output) if args.output else Path(__file__).resolve().parent.parent / "real-listings.csv"

    # owner واحد لكل الإعلانات
    owner_password = args.owner_password or f"Op{secrets.token_urlsafe(10)}!"
    owner = {
        "email": args.owner_email,
        "name_ar": args.owner_name,
        "name_en": args.owner_name_en,
        "phone": args.phone or "",
        "password": owner_password,
        "role": "business",
    }

    print(f"▶ المالك: {owner['name_ar']} ({owner['email']})")
    print(f"▶ رقم التواصل في كل إعلان: {args.phone or '(فارغ)'}")
    print(f"▶ قراءة العروض...")
    offers = read_offers(in_path)
    print(f"  → {len(offers)} عرض صالح بعد scrub PII")

    print(f"▶ قراءة الطلبات...")
    demands = read_demands(in_path)
    print(f"  → {len(demands)} طلب صالح")

    all_items = offers + demands
    print(f"\n▶ المجموع: {len(all_items)} إعلان قبل التحديد")

    if not args.no_limit and len(all_items) > args.limit:
        section_buckets: dict[str, list[dict]] = {}
        for it in all_items:
            section_buckets.setdefault(it["section"], []).append(it)
        per_section = args.limit // len(section_buckets)
        selected = []
        for sec, items in section_buckets.items():
            items.sort(key=lambda x: -len(x["text"]))
            selected.extend(items[:per_section])
        leftover = [x for x in all_items if x not in selected]
        leftover.sort(key=lambda x: -len(x["text"]))
        selected.extend(leftover[:args.limit - len(selected)])
        all_items = selected
        print(f"  → بعد التحديد بالجودة: {len(all_items)}")

    rows = [to_csv_row(item, owner, args.phone or "") for item in all_items]

    # تقرير
    print(f"\n📊 التوزيع النهائي:")
    sec_counts = {}
    for r in rows:
        sec_counts[r["section"]] = sec_counts.get(r["section"], 0) + 1
    for s, c in sorted(sec_counts.items(), key=lambda x: -x[1]):
        print(f"  {s:12} → {c}")

    # تحقق نهائي من الـ PII (paranoid)
    leak_count = 0
    for r in rows:
        for fld in ("title_ar", "description_ar"):
            v = r[fld]
            # أي 9+ أرقام متتالية = مشبوه
            if re.search(r"\d{9,}", v) or re.search(EMAIL_PATTERN, v):
                leak_count += 1
                print(f"  ⚠️ احتمال leak في {fld}: {v[:80]}")
    if leak_count == 0:
        print(f"\n🔒 فحص PII: ✓ صفر تسريبات في الـ {len(rows)} إعلان")
    else:
        print(f"\n⚠️ {leak_count} حالات مشبوهة — راجعها يدوياً")

    fieldnames = list(rows[0].keys())
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        w.writeheader()
        w.writerows(rows)

    print(f"\n✅ تم الكتابة: {out_path}")
    print(f"   ({len(rows)} إعلان × مالك واحد)")
    print(f"\n🔑 احفظ بيانات حساب المالك:")
    print(f"   Email:    {owner['email']}")
    print(f"   Password: {owner['password']}")
    print(f"   Phone:    {owner['phone']}")
    print(f"\n▶ التالي:")
    print(f"   node scripts/bulk-import/import.js scripts/bulk-import/real-listings.csv --dry-run")


if __name__ == "__main__":
    main()
