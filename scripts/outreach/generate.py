#!/usr/bin/env python3
"""
يقرأ ملف Excel ويبني صفحة HTML واحدة تحتوي على بطاقة لكل عميل،
كل بطاقة فيها زر يفتح WhatsApp Desktop على الماك برسالة جاهزة.

الاستخدام:
    python3 scripts/outreach/generate.py
    open scripts/outreach/outreach.html

الـ HTML:
    - يحفظ التقدّم في localStorage (يمكن إغلاق الصفحة والعودة)
    - فلاتر: حالة، تصنيف، بحث
    - 3 قوالب رسائل قابلة للتبديل
    - وضع "تركيز" يعرض بطاقة واحدة + كيبورد shortcuts
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("❌ pandas مطلوب. شغّل: pip3 install pandas openpyxl", file=sys.stderr)
    sys.exit(1)


# ─────────── أدوات ───────────
ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")


def clean_phone(raw) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    s = str(raw).translate(ARABIC_DIGITS)
    s = re.sub(r"[^\d]", "", s)
    if not s:
        return None
    if s.startswith("00966"):
        s = "966" + s[5:]
    elif s.startswith("0") and len(s) == 10:
        s = "966" + s[1:]
    elif s.startswith("5") and len(s) == 9:
        s = "966" + s
    elif s.startswith("966"):
        pass
    elif len(s) == 9 and s.startswith("5"):
        s = "966" + s
    else:
        return None
    return s if len(s) == 12 else None


def clean_text(t) -> str:
    if t is None or (isinstance(t, float) and pd.isna(t)):
        return ""
    s = str(t).strip()
    s = re.sub(r"\s+", " ", s)
    return s


def category_tag(cat: str) -> str:
    """تصنيف مبسّط للفلتر."""
    c = (cat or "").strip().lower()
    if "تأجير أسطول" in c: return "fleet_rent"
    if "بيع أصول" in c or "سيارات للبيع" in c or "مبيعات" in c: return "fleet_sale"
    if "بيع كيان" in c or "شراء كيان" in c or "شراكة" in c: return "ma"
    if "عقود" in c or "نقل" in c or "مقاول" in c: return "contracts"
    if "توظيف" in c or "مناديب" in c or "كادر" in c or "موظف" in c: return "jobs"
    if "معقب" in c or "تعقيب" in c: return "service_muaqqib"
    if "تأمين" in c: return "service_insurance"
    if "تمويل" in c or "ضريبي" in c or "محاسب" in c: return "service_finance"
    if "قانوني" in c or "تراخيص" in c: return "service_legal"
    if "استشار" in c: return "consulting"
    return "other"


CATEGORY_LABELS_AR = {
    "fleet_rent":        "تأجير أسطول",
    "fleet_sale":        "بيع أصول",
    "ma":                "بيع/شراء كيان",
    "contracts":         "عقود تشغيلية",
    "jobs":              "توظيف ومناديب",
    "service_muaqqib":   "خدمات معقّب",
    "service_insurance": "خدمات تأمين",
    "service_finance":   "تمويل/محاسبة",
    "service_legal":     "خدمات قانونية",
    "consulting":        "استشارات",
    "other":             "أخرى",
}


# ─────────── قراءة الـ Excel ───────────
def read_offers(path: Path) -> list[dict]:
    df = pd.read_excel(path, sheet_name="قاعدة بيانات العروض")
    rows = []
    for _, r in df.iterrows():
        phone = clean_phone(r.get("رقم الجوال"))
        if not phone:
            continue
        text = clean_text(r.get("النص الكامل للإعلان"))
        if not text or len(text) < 20:
            continue
        cat = clean_text(r.get("التصنيف"))
        name = clean_text(r.get("اسم المعلن"))
        if name == "غير محدد":
            name = ""
        city = clean_text(r.get("المدينة/الموقع"))
        if city == "غير محدد":
            city = ""
        rows.append({
            "phone":     phone,
            "name":      name,
            "category":  cat,
            "category_tag":   category_tag(cat),
            "category_label": CATEGORY_LABELS_AR[category_tag(cat)],
            "city":      city,
            "text":      text[:400],   # نص مختصر للعرض
            "side":      "offer",
        })
    return rows


def read_demands(path: Path) -> list[dict]:
    df = pd.read_excel(path, sheet_name="قاعدة بيانات الطلبات", header=0)
    rows = []
    for _, r in df.iterrows():
        vals = r.values
        if len(vals) < 11:
            continue
        # ورقة الطلبات بها column misalignment:
        # 0=ref, 1=date, 2=source, 3=actual_name, 4=phone, 5=need_type,
        # 6=city, 7=specs, 8=budget, 9=status, 10=text
        phone = clean_phone(vals[4])
        if not phone:
            continue
        text = clean_text(vals[-1])
        if not text or len(text) < 15:
            continue
        name = clean_text(vals[3])
        if name.startswith("966") or "966" in name:
            name = ""
        cat = clean_text(vals[5])
        city = clean_text(vals[6])
        if city == "غير محدد":
            city = ""
        rows.append({
            "phone":     phone,
            "name":      name,
            "category":  cat,
            "category_tag":   category_tag(cat),
            "category_label": CATEGORY_LABELS_AR[category_tag(cat)],
            "city":      city,
            "text":      text[:400],
            "side":      "demand",
        })
    return rows


def dedupe_by_phone(items: list[dict]) -> list[dict]:
    """لو نفس الرقم موجود في عرض وطلب → اعتبره عرض واحد."""
    seen = {}
    for it in items:
        if it["phone"] not in seen:
            seen[it["phone"]] = it
        else:
            # ادمج النصوص لو مختلفة
            prev = seen[it["phone"]]
            if it["text"] != prev["text"]:
                prev["text"] = (prev["text"] + " | " + it["text"])[:500]
    return list(seen.values())


# ─────────── HTML Template ───────────
HTML_TEMPLATE = r"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>نوافذ — حملة WhatsApp</title>
<style>
:root {
  --navy:        #1B2C6E;
  --navy-dark:   #0F1E52;
  --emerald:     #0D9B6C;
  --emerald-dark:#097A54;
  --emerald-bg:  #F0FAF6;
  --gray-50:     #F9FAFB;
  --gray-100:    #F3F4F6;
  --gray-200:    #E5E7EB;
  --gray-500:    #6B7280;
  --gray-700:    #374151;
  --gray-900:    #111827;
}
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  font-family: -apple-system, "Segoe UI", Tahoma, sans-serif;
  background: var(--gray-50);
  color: var(--gray-900);
  font-size: 14px;
}
header.topbar {
  background: var(--navy);
  color: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 50;
}
header.topbar h1 {
  margin: 0; font-size: 18px; font-weight: 900;
}
.stats {
  display: flex; gap: 16px; align-items: center;
  font-size: 13px;
}
.stat { background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 8px; }
.stat strong { font-size: 16px; }
.progress-bar {
  height: 6px; background: rgba(255,255,255,0.15);
  width: 200px; border-radius: 3px; overflow: hidden;
}
.progress-bar > div {
  height: 100%; background: var(--emerald);
  transition: width 0.3s ease;
}

.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  padding: 16px 24px;
  max-width: 1400px;
  margin: 0 auto;
}
aside.filters {
  background: white;
  border-radius: 12px;
  border: 1px solid var(--gray-200);
  padding: 16px;
  height: fit-content;
  position: sticky;
  top: 90px;
}
.filter-group { margin-bottom: 16px; }
.filter-group label {
  display: block; font-size: 11px; font-weight: 700;
  color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.filter-group input, .filter-group select {
  width: 100%; padding: 8px 10px; border: 1px solid var(--gray-200);
  border-radius: 8px; font-size: 13px; font-family: inherit;
  background: white;
}
.filter-group input:focus, .filter-group select:focus {
  outline: none; border-color: var(--navy);
}

button {
  font-family: inherit; cursor: pointer; border: none;
}
.btn-primary {
  background: var(--emerald); color: white;
  padding: 10px 14px; border-radius: 10px;
  font-weight: 700; font-size: 13px;
  width: 100%;
  transition: background 0.15s;
}
.btn-primary:hover { background: var(--emerald-dark); }
.btn-secondary {
  background: var(--gray-100); color: var(--gray-700);
  padding: 10px 14px; border-radius: 10px;
  font-weight: 600; font-size: 12px;
  width: 100%;
  margin-top: 8px;
}
.btn-secondary:hover { background: var(--gray-200); }

main {
  display: flex; flex-direction: column; gap: 10px;
}
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  transition: all 0.15s;
}
.card.sent  { background: var(--emerald-bg); border-color: rgba(13,155,108,0.2); opacity: 0.75; }
.card.skipped { opacity: 0.5; background: var(--gray-50); }

.card-body {
  min-width: 0;
}
.card-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-bottom: 6px;
}
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 999px;
  font-size: 11px; font-weight: 600;
}
.badge-status { background: var(--gray-100); color: var(--gray-700); }
.badge-status.sent  { background: var(--emerald-bg); color: var(--emerald-dark); }
.badge-status.skipped { background: #FEF3C7; color: #92400E; }
.badge-cat   { background: rgba(27,44,110,0.08); color: var(--navy); }
.badge-side  { background: rgba(13,155,108,0.1); color: var(--emerald-dark); }
.badge-city  { background: var(--gray-100); color: var(--gray-700); }
.phone {
  font-family: ui-monospace, "SF Mono", monospace;
  font-weight: 600; font-size: 13px; color: var(--gray-700);
  direction: ltr; display: inline-block;
}
.name {
  font-weight: 700; color: var(--navy); font-size: 14px;
}
.text {
  color: var(--gray-500); font-size: 12px; line-height: 1.6;
  margin: 6px 0 0;
  white-space: pre-wrap; word-break: break-word;
  max-height: 64px; overflow: hidden; position: relative;
}
.text.expanded { max-height: none; }
.text-toggle {
  background: none; border: none; color: var(--emerald-dark);
  font-size: 11px; font-weight: 600; padding: 4px 0;
  cursor: pointer;
}

.actions {
  display: flex; flex-direction: column; gap: 6px;
  align-items: stretch; min-width: 160px;
}
.btn-wa {
  background: #25D366; color: white;
  border-radius: 8px; padding: 9px 12px;
  font-weight: 700; font-size: 12px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  text-decoration: none;
  transition: background 0.15s;
}
.btn-wa:hover { background: #1FB855; }
.btn-mark {
  background: var(--emerald); color: white;
  border-radius: 8px; padding: 7px 10px;
  font-weight: 600; font-size: 11px;
  display: inline-flex; align-items: center; justify-content: center; gap: 4px;
}
.btn-mark:hover { background: var(--emerald-dark); }
.btn-skip {
  background: white; border: 1px solid var(--gray-200);
  color: var(--gray-500); border-radius: 8px;
  padding: 7px 10px; font-size: 11px; font-weight: 500;
}
.btn-msg {
  background: var(--gray-50); border: 1px solid var(--gray-200);
  color: var(--gray-700); border-radius: 8px;
  padding: 6px 10px; font-size: 11px; font-weight: 500;
}
.msg-preview {
  display: none;
  background: var(--gray-50);
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 8px;
  font-size: 12px; line-height: 1.7;
  white-space: pre-wrap;
  color: var(--gray-700);
  border: 1px dashed var(--gray-200);
}
.msg-preview.open { display: block; }

.empty {
  text-align: center; padding: 60px 20px;
  color: var(--gray-500);
}

#focus-mode {
  display: none;
  position: fixed; inset: 0;
  background: rgba(15, 30, 82, 0.92);
  z-index: 100;
  align-items: center; justify-content: center;
  padding: 20px;
}
#focus-mode.open { display: flex; }
#focus-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 560px; width: 100%;
  box-shadow: 0 25px 60px rgba(0,0,0,0.4);
  position: relative;
}
#focus-close {
  position: absolute; top: 12px; left: 12px;
  background: none; border: none; font-size: 20px;
  color: var(--gray-500); cursor: pointer;
  width: 36px; height: 36px; border-radius: 50%;
}
#focus-close:hover { background: var(--gray-100); }
#focus-card .name { font-size: 18px; }
#focus-card .phone { font-size: 16px; margin-top: 4px; }
#focus-card .msg-preview { display: block; max-height: 280px; overflow-y: auto; }
#focus-card .actions { flex-direction: row; margin-top: 16px; }
.kbd {
  display: inline-block; padding: 2px 6px;
  background: var(--gray-100); border: 1px solid var(--gray-200);
  border-radius: 4px; font-family: ui-monospace, monospace;
  font-size: 10px; color: var(--gray-700);
}

@media (max-width: 800px) {
  .layout { grid-template-columns: 1fr; padding: 12px; }
  aside.filters { position: static; }
}
</style>
</head>
<body>

<header class="topbar">
  <h1>📡 نوافذ — حملة WhatsApp Outreach</h1>
  <div class="stats">
    <span class="stat">✅ مُرسل: <strong id="stat-sent">0</strong></span>
    <span class="stat">⏭ متخطّى: <strong id="stat-skipped">0</strong></span>
    <span class="stat">📋 المتبقي: <strong id="stat-remaining">0</strong></span>
    <span class="stat" id="stat-percent-wrap">📈 <strong id="stat-percent">0%</strong></span>
    <div class="progress-bar"><div id="progress-fill" style="width:0%"></div></div>
  </div>
</header>

<div class="layout">

<aside class="filters">
  <div class="filter-group">
    <label>🔍 بحث</label>
    <input id="search" placeholder="رقم، اسم، نص..." />
  </div>

  <div class="filter-group">
    <label>📦 التصنيف</label>
    <select id="filter-cat">
      <option value="">كل التصنيفات</option>
    </select>
  </div>

  <div class="filter-group">
    <label>🏷️ الحالة</label>
    <select id="filter-status">
      <option value="">الكل</option>
      <option value="pending">لم يُرسل</option>
      <option value="sent">تم الإرسال</option>
      <option value="skipped">متخطّى</option>
    </select>
  </div>

  <div class="filter-group">
    <label>📝 قالب الرسالة</label>
    <select id="template-choice">
      <option value="standard">رسمي — قالب 1</option>
      <option value="warm">ودّي — قالب 2</option>
      <option value="short">قصير — قالب 3</option>
    </select>
  </div>

  <button class="btn-primary" id="btn-focus">🎯 وضع التركيز</button>
  <button class="btn-secondary" id="btn-export">💾 تصدير CSV</button>
  <button class="btn-secondary" id="btn-reset">🔄 إعادة ضبط التقدّم</button>

  <p style="font-size:11px;color:var(--gray-500);margin-top:14px;line-height:1.7;">
    <strong>⌨️ في وضع التركيز:</strong><br />
    <span class="kbd">W</span> فتح واتساب &nbsp;
    <span class="kbd">S</span> تم إرسالها &nbsp;
    <span class="kbd">K</span> تخطّي &nbsp;
    <span class="kbd">→</span> التالي
  </p>
</aside>

<main id="cards"></main>
</div>

<!-- Focus Mode Modal -->
<div id="focus-mode">
  <div id="focus-card">
    <button id="focus-close" title="إغلاق">✕</button>
    <div id="focus-content"></div>
  </div>
</div>

<script>
/* ═════════ بيانات العملاء (مدمجة من Excel) ═════════ */
const RECIPIENTS = __DATA_PLACEHOLDER__;

/* ═════════ قوالب الرسائل ═════════ */
const TEMPLATES = {
  standard: ({name, category_label}) => `السلام عليكم${name ? ' ' + name : ''}

شاهدنا إعلانك حول ${category_label} في قروبات السوق اللوجستي السعودي، وأعجبنا عرضك.

نحن من فريق "نوافذ" — منصة سعودية مجانية للفرص اللوجستية:
👉 https://www.nwafizlogi.com

نحب نقدّم لك حساباً مجانياً لنشر إعلانك ووصوله لجمهور أوسع — بدون أي رسوم.

لو تحب، أرسل "نعم" وأرسل لك رابط التسجيل والتفاصيل.

تحياتنا 🤝
نوافذ — رادار الفرص اللوجستية`,

  warm: ({name, category_label, city}) => `أهلاً وسهلاً${name ? ' أستاذ ' + name : ''} 👋

شفنا إعلانك عن ${category_label}${city ? ' في ' + city : ''} في قروبات اللوجستيك، وحبينا نتواصل معك.

أطلقنا منصة "نوافذ" لتجميع الفرص اللوجستية في السعودية، ونوفر لك:
• نشر مجاني تماماً للإعلانات
• وصول لمشترين جدّيين
• تواصل مباشر دون وسيط

الرابط: https://www.nwafizlogi.com

لو حابب نسجّل حسابك، أرسل "نعم" وراح نسوّيه لك خلال 5 دقائق ✨`,

  short: ({category_label}) => `السلام عليكم

شفنا إعلانك حول ${category_label} ونوفر لك نشره مجاناً على منصة "نوافذ":
https://www.nwafizlogi.com

تبي حساب؟ أرسل "نعم" 🤝`,
};

/* ═════════ Helpers ═════════ */
const STORAGE_KEY = 'nwafiz_outreach_status_v1';

function loadStatus() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveStatus(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
let STATUS = loadStatus();   // { phone: 'sent'|'skipped' }

function buildMessage(r) {
  const tplName = document.getElementById('template-choice').value;
  const tpl     = TEMPLATES[tplName] || TEMPLATES.standard;
  return tpl({
    name:           r.name || '',
    category_label: r.category_label || 'الخدمات اللوجستية',
    city:           r.city || '',
  });
}

function waUrl(phone, message) {
  // wa.me opens WhatsApp Desktop on Mac automatically
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function updateStats() {
  const total     = RECIPIENTS.length;
  const sent      = Object.values(STATUS).filter(s => s === 'sent').length;
  const skipped   = Object.values(STATUS).filter(s => s === 'skipped').length;
  const remaining = total - sent - skipped;
  const pct       = Math.round((sent / total) * 100);
  document.getElementById('stat-sent').textContent      = sent;
  document.getElementById('stat-skipped').textContent   = skipped;
  document.getElementById('stat-remaining').textContent = remaining;
  document.getElementById('stat-percent').textContent   = pct + '%';
  document.getElementById('progress-fill').style.width  = pct + '%';
}

function applyFilters() {
  const q     = document.getElementById('search').value.toLowerCase().trim();
  const cat   = document.getElementById('filter-cat').value;
  const stat  = document.getElementById('filter-status').value;
  return RECIPIENTS.filter(r => {
    const status = STATUS[r.phone] || 'pending';
    if (stat && status !== stat) return false;
    if (cat && r.category_tag !== cat) return false;
    if (q) {
      const hay = (r.phone + ' ' + r.name + ' ' + r.text + ' ' + r.category).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

function renderCards() {
  const list = applyFilters();
  const root = document.getElementById('cards');

  if (list.length === 0) {
    root.innerHTML = `<div class="empty">لا توجد نتائج بهذه الفلاتر.</div>`;
    return;
  }

  root.innerHTML = list.map(r => {
    const status = STATUS[r.phone] || 'pending';
    const statusLabel = status === 'sent' ? '✓ تم الإرسال'
                      : status === 'skipped' ? '⏭ متخطّى'
                      : '⏳ لم يُرسل';
    const message = buildMessage(r);
    return `
    <div class="card ${status}" data-phone="${r.phone}">
      <div class="card-body">
        <div class="card-head">
          <span class="badge badge-status ${status}">${statusLabel}</span>
          <span class="badge badge-cat">${escapeHtml(r.category_label)}</span>
          ${r.side === 'demand'
            ? '<span class="badge badge-side">طلب</span>'
            : '<span class="badge badge-side">عرض</span>'}
          ${r.city ? `<span class="badge badge-city">📍 ${escapeHtml(r.city)}</span>` : ''}
        </div>
        ${r.name ? `<div class="name">${escapeHtml(r.name)}</div>` : '<div class="name" style="color:#9ca3af">(بدون اسم)</div>'}
        <div class="phone">+${r.phone}</div>
        <div class="text" data-collapsed="1">${escapeHtml(r.text)}</div>
        ${r.text.length > 150 ? `<button class="text-toggle" data-action="expand-text">إظهار المزيد ▾</button>` : ''}
        <div class="msg-preview" data-msg-preview>${escapeHtml(message)}</div>
      </div>
      <div class="actions">
        <a href="${waUrl(r.phone, message)}"
           target="_blank"
           class="btn-wa"
           data-action="open-wa">
          📱 افتح واتساب
        </a>
        <button class="btn-msg" data-action="toggle-msg">👁️ معاينة الرسالة</button>
        <button class="btn-mark" data-action="mark-sent">✓ تم الإرسال</button>
        <button class="btn-skip" data-action="skip">تخطّي</button>
      </div>
    </div>`;
  }).join('');
}

/* ═════════ Card actions ═════════ */
document.getElementById('cards').addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const phone = card.dataset.phone;
  const action = e.target.dataset.action;

  if (action === 'open-wa') {
    // mark "sent" automatically after a short delay so the user has time to verify
    setTimeout(() => {
      if (!STATUS[phone]) {
        // ask once: did you send?
        markSent(phone);
      }
    }, 1500);
  }
  if (action === 'mark-sent') markSent(phone);
  if (action === 'skip')      skip(phone);
  if (action === 'toggle-msg') {
    const pv = card.querySelector('[data-msg-preview]');
    pv.classList.toggle('open');
  }
  if (action === 'expand-text') {
    const t = card.querySelector('.text');
    t.classList.toggle('expanded');
    e.target.textContent = t.classList.contains('expanded') ? 'إخفاء ▴' : 'إظهار المزيد ▾';
  }
});

function markSent(phone) {
  STATUS[phone] = 'sent';
  saveStatus(STATUS);
  renderCards();
  updateStats();
  if (focusOpen) advanceFocus();
}
function skip(phone) {
  STATUS[phone] = 'skipped';
  saveStatus(STATUS);
  renderCards();
  updateStats();
  if (focusOpen) advanceFocus();
}

/* ═════════ Filters / Search ═════════ */
document.getElementById('search').addEventListener('input', renderCards);
document.getElementById('filter-cat').addEventListener('change', renderCards);
document.getElementById('filter-status').addEventListener('change', renderCards);
document.getElementById('template-choice').addEventListener('change', renderCards);

/* ═════════ Reset ═════════ */
document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('إعادة ضبط التقدّم لكل العملاء؟ سيُمسح سجلّ المُرسل والمتخطّى.')) {
    STATUS = {};
    saveStatus(STATUS);
    renderCards();
    updateStats();
  }
});

/* ═════════ Export CSV ═════════ */
document.getElementById('btn-export').addEventListener('click', () => {
  const rows = [['phone','name','category','city','status','side','text']];
  RECIPIENTS.forEach(r => {
    rows.push([
      r.phone, r.name, r.category_label, r.city,
      STATUS[r.phone] || 'pending', r.side,
      (r.text || '').replace(/"/g, '""').slice(0, 200),
    ]);
  });
  const csv = rows.map(row => row.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nwafiz-outreach-status.csv';
  a.click();
  URL.revokeObjectURL(url);
});

/* ═════════ Focus Mode ═════════ */
let focusOpen = false;
let focusList = [];
let focusIdx  = 0;

function openFocus() {
  focusList = applyFilters().filter(r => (STATUS[r.phone] || 'pending') === 'pending');
  if (focusList.length === 0) {
    alert('ما في عملاء يلائمون الفلاتر الحالية.');
    return;
  }
  focusIdx = 0;
  focusOpen = true;
  document.getElementById('focus-mode').classList.add('open');
  renderFocus();
}
function closeFocus() {
  focusOpen = false;
  document.getElementById('focus-mode').classList.remove('open');
}
function advanceFocus() {
  focusIdx++;
  if (focusIdx >= focusList.length) {
    document.getElementById('focus-content').innerHTML =
      '<div style="text-align:center;padding:30px;"><h2>🎉 خلاص!</h2><p>انتهيت من كل العملاء في الفلتر الحالي.</p></div>';
    return;
  }
  renderFocus();
}
function renderFocus() {
  const r = focusList[focusIdx];
  if (!r) return;
  const message = buildMessage(r);
  document.getElementById('focus-content').innerHTML = `
    <div style="text-align:center;color:var(--gray-500);font-size:12px;margin-bottom:8px;">
      ${focusIdx + 1} من ${focusList.length}
    </div>
    <div class="card-head" style="justify-content:center;">
      <span class="badge badge-cat">${escapeHtml(r.category_label)}</span>
      ${r.city ? `<span class="badge badge-city">📍 ${escapeHtml(r.city)}</span>` : ''}
    </div>
    ${r.name ? `<div class="name" style="text-align:center;font-size:18px;margin-top:8px;">${escapeHtml(r.name)}</div>` : ''}
    <div class="phone" style="text-align:center;font-size:18px;margin-top:4px;">+${r.phone}</div>
    <div class="text" style="margin-top:14px;max-height:120px;overflow-y:auto;background:var(--gray-50);padding:10px;border-radius:8px;">${escapeHtml(r.text)}</div>
    <div class="msg-preview open" style="margin-top:14px;">${escapeHtml(message)}</div>
    <div class="actions">
      <a href="${waUrl(r.phone, message)}" target="_blank" class="btn-wa" style="flex:1;" data-fa="open">📱 افتح واتساب <span class="kbd" style="background:rgba(255,255,255,0.2);color:white;">W</span></a>
      <button class="btn-mark" style="flex:1;" data-fa="sent">✓ تم الإرسال <span class="kbd" style="background:rgba(255,255,255,0.2);color:white;">S</span></button>
      <button class="btn-skip" style="flex:1;" data-fa="skip">⏭ تخطّي <span class="kbd">K</span></button>
    </div>
  `;
}
document.getElementById('btn-focus').addEventListener('click', openFocus);
document.getElementById('focus-close').addEventListener('click', closeFocus);
document.getElementById('focus-content').addEventListener('click', (e) => {
  const r = focusList[focusIdx];
  if (!r) return;
  const fa = e.target.closest('[data-fa]')?.dataset.fa;
  if (fa === 'sent') markSent(r.phone);
  if (fa === 'skip') skip(r.phone);
  if (fa === 'open') {
    // auto-mark as sent after delay
    setTimeout(() => { if (focusList[focusIdx]?.phone === r.phone && !STATUS[r.phone]) markSent(r.phone); }, 1500);
  }
});
document.addEventListener('keydown', (e) => {
  if (!focusOpen) return;
  const r = focusList[focusIdx];
  if (!r) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Escape') closeFocus();
  if (e.key === 'w' || e.key === 'W') {
    window.open(waUrl(r.phone, buildMessage(r)), '_blank');
    setTimeout(() => { if (focusList[focusIdx]?.phone === r.phone && !STATUS[r.phone]) markSent(r.phone); }, 1500);
  }
  if (e.key === 's' || e.key === 'S') markSent(r.phone);
  if (e.key === 'k' || e.key === 'K') skip(r.phone);
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    advanceFocus();
  }
});

/* ═════════ Populate category dropdown ═════════ */
const catSet = new Set(RECIPIENTS.map(r => r.category_tag));
const catSelect = document.getElementById('filter-cat');
[
  ['fleet_rent',        'تأجير أسطول'],
  ['fleet_sale',        'بيع أصول'],
  ['ma',                'بيع/شراء كيان'],
  ['contracts',         'عقود تشغيلية'],
  ['jobs',              'توظيف ومناديب'],
  ['service_muaqqib',   'خدمات معقّب'],
  ['service_insurance', 'خدمات تأمين'],
  ['service_finance',   'تمويل/محاسبة'],
  ['service_legal',     'خدمات قانونية'],
  ['consulting',        'استشارات'],
  ['other',             'أخرى'],
].forEach(([tag, label]) => {
  if (catSet.has(tag)) {
    const opt = document.createElement('option');
    opt.value = tag; opt.textContent = label;
    catSelect.appendChild(opt);
  }
});

/* ═════════ First render ═════════ */
renderCards();
updateStats();
</script>
</body>
</html>
"""


# ─────────── Main ───────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input",
        default="/Users/akrameltahir/Downloads/بيانات التسويق والصفقات - لوجستي السعوديه.xlsx")
    ap.add_argument("--output",
        default=str(Path(__file__).resolve().parent / "outreach.html"))
    args = ap.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"❌ الملف غير موجود: {in_path}", file=sys.stderr)
        sys.exit(1)

    print(f"▶ قراءة الـ Excel...")
    offers  = read_offers(in_path)
    print(f"  → {len(offers)} عرض")
    demands = read_demands(in_path)
    print(f"  → {len(demands)} طلب")
    all_items = dedupe_by_phone(offers + demands)
    print(f"  → {len(all_items)} عميل فريد (بعد دمج تكرار الأرقام)")

    # ترتيب: التصنيفات الأكثر فائدة أولاً
    priority = {
        "fleet_rent": 1, "fleet_sale": 2, "ma": 3, "contracts": 4,
        "jobs": 5, "service_muaqqib": 6, "service_insurance": 7,
        "service_finance": 8, "service_legal": 9, "consulting": 10,
        "other": 99,
    }
    all_items.sort(key=lambda x: (priority.get(x["category_tag"], 99), len(x["text"])))

    # توليد HTML
    data_json = json.dumps(all_items, ensure_ascii=False)
    html = HTML_TEMPLATE.replace("__DATA_PLACEHOLDER__", data_json)

    out_path = Path(args.output)
    out_path.write_text(html, encoding="utf-8")
    print(f"\n✅ تم توليد الصفحة: {out_path}")
    print(f"   ({len(all_items)} عميل، حجم الملف: {len(html)//1024} KB)\n")
    print(f"▶ افتحها:")
    print(f"   open '{out_path}'\n")


if __name__ == "__main__":
    main()
