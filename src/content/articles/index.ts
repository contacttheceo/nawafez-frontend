/**
 * SEO articles registry.
 *
 * Each article is a server-rendered page targeting a specific high-intent
 * Arabic keyword for the Saudi logistics market. Add a new entry here +
 * a matching body export and it auto-appears in the index page and the
 * sitemap.
 *
 * Keywords selected based on Google Trends KSA + Search Console queries
 * that already show our site in position 15-25 (we just need to push
 * them to the top by adding dedicated content).
 */

export interface ArticleFaqItem {
  q_ar: string
  a_ar: string
  q_en: string
  a_en: string
}

export interface Article {
  slug: string
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  /** Hero emoji shown on cards + article header */
  icon: string
  /** Last edited — bump this when you update the article (sitemap uses it) */
  updated_at: string
  /** Reading time in minutes (rough) */
  reading_minutes: number
  /** Tags shown as chips at the bottom + used for internal linking */
  tags: string[]
  /** Section this article links to most. Drives "see related listings" CTA. */
  primary_section: 'fleet' | 'contracts' | 'jobs' | 'ma' | 'forum'

  /**
   * Short answer that previews the article's core takeaway. Rendered as
   * a highlighted callout above the body AND surfaced to AI assistants
   * (Perplexity / ChatGPT) that prefer extractable TL;DR openers over
   * long preambles.
   */
  tldr_ar?: string
  tldr_en?: string

  /**
   * Frequently asked questions related to this topic. When provided,
   * the article page renders them as an FAQ section + emits a FAQPage
   * JSON-LD schema that qualifies for Google's FAQ rich result
   * (collapsible panels on the SERP).
   */
  faq?: ArticleFaqItem[]
}

export const ARTICLES: Article[] = [
  {
    slug:           'how-to-sell-truck-in-saudi-arabia',
    title_ar:       'كيف تبيع شاحنتك في السعودية: الدليل الكامل لعام 2026',
    title_en:       'How to Sell Your Truck in Saudi Arabia: Complete 2026 Guide',
    description_ar: 'دليل خطوة بخطوة لبيع شاحنتك في السعودية بأفضل سعر — التسعير، التصوير، المستندات المطلوبة، ونصائح التفاوض.',
    description_en: 'Step-by-step guide to selling your truck in Saudi Arabia at the best price — pricing, photography, required documents, and negotiation tips.',
    icon:           '🚛',
    updated_at:     '2026-10-25',
    reading_minutes: 7,
    tags:           ['شاحنات', 'بيع شاحنات', 'السعودية', 'دليل'],
    primary_section: 'fleet',
    tldr_ar:
      'لبيع شاحنتك بأفضل سعر في السعودية: ابدأ بتسعير مرجعي (10-15٪ فوق متوسط السوق للتفاوض)، ' +
      'صوّر 8-12 صورة احترافية (خارج + داخل + العدّاد + إطارات)، جهّز الاستمارة والسجل ونقل الملكية ' +
      'عبر أبشر، وانشر على منصة B2B متخصصة. متوسط مدة البيع 2-4 أسابيع للشاحنات المسعّرة جيداً.',
    tldr_en:
      'To sell your truck in Saudi Arabia at the best price: start with a reference price ' +
      '(10–15% above market average for negotiation room), take 8–12 pro photos (exterior + ' +
      'interior + odometer + tyres), prepare istimara, service history and the Absher ownership ' +
      'transfer, and list on a specialised B2B platform. Average time to sale is 2–4 weeks for ' +
      'well-priced trucks.',
    faq: [
      {
        q_ar: 'ما المستندات المطلوبة لبيع شاحنة في السعودية؟',
        a_ar: 'استمارة سارية، فحص فني حديث (أقل من 6 أشهر)، سداد كل المخالفات، تخليص بوليصة التأمين، وهوية البائع. نقل الملكية يتم عبر تطبيق أبشر خلال 15 دقيقة بحضور الطرفين.',
        q_en: 'What documents are required to sell a truck in Saudi Arabia?',
        a_en: 'A valid istimara (registration), a recent technical inspection (less than 6 months old), all traffic fines cleared, insurance clearance, and the seller\'s ID. Ownership transfer happens through the Absher app in about 15 minutes with both parties present.',
      },
      {
        q_ar: 'كم المدة المتوقعة لبيع شاحنة؟',
        a_ar: 'بمتوسط 2-4 أسابيع للشاحنات المسعّرة بشكل منافس وبصور احترافية. الشاحنات ذات التسعير المرتفع أو الوصف الضعيف قد تحتاج 2-3 أشهر.',
        q_en: 'How long does it take to sell a truck?',
        a_en: 'On average 2–4 weeks for competitively priced trucks with professional photos. Overpriced trucks or weak descriptions can take 2–3 months.',
      },
      {
        q_ar: 'كيف أسعّر شاحنتي بشكل صحيح؟',
        a_ar: 'ابحث عن 10-15 إعلان لنفس الموديل والسنة بحالة مشابهة. احسب المتوسط ثم أضف 10-15٪ كهامش تفاوض. راعِ الكيلومترات (كل 50 ألف كم تخفض 5-8٪) وحالة الصيانة.',
        q_en: 'How do I price my truck correctly?',
        a_en: 'Research 10–15 listings for the same model, year, and condition. Average them, then add 10–15% as negotiation room. Factor in mileage (each 50,000 km lowers value by 5–8%) and service history.',
      },
      {
        q_ar: 'هل أحتاج فحص فني قبل البيع؟',
        a_ar: 'الفحص الفني إجباري لنقل الملكية — بدون نتيجة فحص سارية لن يُسمح بالنقل عبر أبشر. التكلفة 150-300 ر.س حسب نوع الشاحنة في مراكز فحص معتمدة.',
        q_en: 'Do I need a technical inspection before selling?',
        a_en: 'The technical inspection is mandatory for ownership transfer — Absher will not permit transfer without a valid inspection result. It costs SAR 150–300 depending on the truck class at accredited inspection centres.',
      },
      {
        q_ar: 'ما أفضل منصة لعرض شاحنتي للبيع؟',
        a_ar: 'للشاحنات التجارية B2B، المنصات المتخصصة في النقل أفضل من المنصات العامة — تصل لمشترين جديين (شركات نقل) بدلاً من فضوليين. تجنّب نشر رقم جوالك العلني لتفادي الاتصالات السبامية.',
        q_en: 'What is the best platform to list my truck for sale?',
        a_en: 'For commercial B2B trucks, specialised logistics platforms outperform general classifieds — they reach serious buyers (transport companies) rather than browsers. Avoid publishing your personal mobile number to limit spam calls.',
      },
    ],
  },
  {
    slug:           'transport-license-types-saudi-arabia',
    title_ar:       'أنواع تراخيص نقل البضائع في السعودية وكيفية الحصول عليها',
    title_en:       'Freight Transport License Types in Saudi Arabia',
    description_ar: 'تعرّف على فئات تراخيص نقل البضائع التي تصدرها الهيئة العامة للنقل (TGA): البري، الثقيل، المبرّد، الخطر — متطلبات كل فئة والرسوم.',
    description_en: 'Learn about the freight transport license categories issued by the Saudi Transport General Authority (TGA): land, heavy, refrigerated, hazardous.',
    icon:           '📜',
    updated_at:     '2026-10-24',
    reading_minutes: 9,
    tags:           ['تراخيص', 'TGA', 'الهيئة العامة للنقل', 'نقل البضائع'],
    primary_section: 'ma',
    tldr_ar:
      'تُصدر الهيئة العامة للنقل (TGA) أربع فئات رئيسية لتراخيص نقل البضائع في السعودية: ' +
      'النقل البري العام، النقل الثقيل، النقل المبرّد، ونقل المواد الخطرة. كل فئة لها متطلبات ' +
      'ورسوم مختلفة، ويتم التقديم إلكترونياً عبر منصة TGA. مدة إصدار الرخصة 15-30 يوم عمل.',
    tldr_en:
      'Saudi Arabia\'s Transport General Authority (TGA) issues four main freight transport ' +
      'license categories: general land transport, heavy transport, refrigerated, and hazardous ' +
      'materials. Each has distinct requirements and fees; applications go through the TGA ' +
      'portal and typically take 15–30 business days.',
    faq: [
      {
        q_ar: 'ما الجهة المصدرة لتراخيص نقل البضائع في السعودية؟',
        a_ar: 'الهيئة العامة للنقل (Transport General Authority — TGA) هي الجهة الحكومية المسؤولة عن إصدار كل تراخيص نقل البضائع البرية في المملكة.',
        q_en: 'Which authority issues freight transport licenses in Saudi Arabia?',
        a_en: 'The Transport General Authority (TGA) is the government body responsible for issuing all land freight transport licenses in the Kingdom.',
      },
      {
        q_ar: 'كم المدة اللازمة لإصدار رخصة نقل البضائع؟',
        a_ar: 'تستغرق المدة بين 15 إلى 30 يوم عمل من تاريخ اكتمال المستندات والدفع، وتزداد المدة للتراخيص الخاصة (مثل نقل المواد الخطرة) التي تتطلب تفتيش ميداني.',
        q_en: 'How long does a freight transport license take to issue?',
        a_en: 'Between 15 and 30 business days from the date documents and fees are complete. Specialty licenses (e.g. hazmat) take longer due to the required field inspection.',
      },
      {
        q_ar: 'هل يمكن الحصول على ترخيص نقل كفرد أم للشركات فقط؟',
        a_ar: 'بعض الفئات (كتأجير الشاحنات الفردي) متاحة للأفراد السعوديين بشروط، بينما فئات النقل التجاري والنقل الثقيل تتطلب سجل تجاري ساري.',
        q_en: 'Can individuals get a transport license, or is it companies only?',
        a_en: 'Some categories (like single-vehicle rental) are open to Saudi individuals under conditions, while commercial and heavy transport categories require a valid commercial registration (CR).',
      },
      {
        q_ar: 'كم تكلفة رخصة نقل البضائع في السعودية؟',
        a_ar: 'الرسوم تبدأ من 1,000 ر.س للفئة البرية الأساسية، وتصل إلى 10,000 ر.س+ للنقل الثقيل أو المواد الخطرة، وتُجدَّد كل سنة أو ثلاث سنوات حسب الفئة.',
        q_en: 'How much does a freight transport license cost?',
        a_en: 'Fees start at SAR 1,000 for basic land transport and reach SAR 10,000+ for heavy transport or hazardous materials. Renewals are annual or every three years depending on the class.',
      },
      {
        q_ar: 'هل أحتاج رخصة منفصلة لكل شاحنة أم رخصة واحدة للأسطول؟',
        a_ar: 'رخصة التشغيل تُمنح للنشاط التجاري ككل، لكن كل شاحنة تحتاج بطاقة تشغيل مستقلة ترتبط بالرخصة الأم وتُدرج ضمن أسطول المنشأة في منصة TGA.',
        q_en: 'Do I need a separate license per truck or one for the whole fleet?',
        a_en: 'The operating license is issued for the business as a whole, but each truck requires its own operating card linked to the parent license and registered under the entity\'s fleet in the TGA portal.',
      },
    ],
  },
  {
    slug:           'truck-rental-prices-saudi-arabia',
    title_ar:       'متوسط أسعار إيجار الشاحنات في السعودية لعام 2026',
    title_en:       'Average Truck Rental Prices in Saudi Arabia 2026',
    description_ar: 'دليل أسعار إيجار الشاحنات والمعدات في السعودية بحسب الفئة والمدة والمنطقة — أرقام محدثة من السوق الفعلي.',
    description_en: 'Truck and equipment rental price guide for Saudi Arabia by category, duration, and region — fresh numbers from the actual market.',
    icon:           '💰',
    updated_at:     '2026-10-25',
    reading_minutes: 6,
    tags:           ['أسعار', 'إيجار شاحنات', 'تكاليف', 'السعودية'],
    primary_section: 'fleet',
    tldr_ar:
      'متوسط إيجار الشاحنات التجارية في السعودية 2026: شاحنة متوسطة (6-10 طن) 180-280 ر.س/يوم ' +
      'أو 4,500-7,000 ر.س/شهر. شاحنة ثقيلة (قاطرة 40 طن) 450-650 ر.س/يوم أو 11,000-16,000 ر.س/شهر. ' +
      'شاحنة مبرّدة تضيف 30-45٪ على السعر. العقود السنوية تخفض السعر 15-25٪ مقارنة بالإيجار الشهري.',
    tldr_en:
      'Average commercial truck rental in Saudi Arabia (2026): a medium truck (6–10 t) runs ' +
      'SAR 180–280/day or SAR 4,500–7,000/month. A heavy truck (40 t articulated) runs ' +
      'SAR 450–650/day or SAR 11,000–16,000/month. Refrigerated trucks add 30–45%. Annual ' +
      'contracts reduce the rate by 15–25% versus monthly rentals.',
    faq: [
      {
        q_ar: 'كم يبلغ متوسط إيجار شاحنة 10 طن شهرياً في الرياض؟',
        a_ar: 'بين 5,500 و 7,000 ر.س شهرياً شاملاً الصيانة الدورية بدون سائق. مع سائق تضيف 3,500-5,000 ر.س لراتب السائق + تأمين. الأسعار في جدة والدمام قريبة من الرياض بفارق ±5٪.',
        q_en: 'What is the monthly rental for a 10-tonne truck in Riyadh?',
        a_en: 'Between SAR 5,500 and 7,000 per month including regular maintenance, without a driver. Adding a driver costs an extra SAR 3,500–5,000 for salary plus insurance. Jeddah and Dammam are within ±5% of Riyadh.',
      },
      {
        q_ar: 'هل يشمل الإيجار الوقود والصيانة؟',
        a_ar: 'عادةً لا. الإيجار الأساسي يشمل الصيانة الدورية (زيوت وفلاتر) فقط. الوقود وإصلاحات الحوادث على المستأجر. العقود الشاملة (All-inclusive) أعلى 25-30٪ وتُغطّي كل شيء ما عدا الوقود.',
        q_en: 'Does the rental include fuel and maintenance?',
        a_en: 'Usually no. The base rental covers routine maintenance (oil, filters) only. Fuel and accident repairs are the renter\'s responsibility. All-inclusive contracts cost 25–30% more and cover everything except fuel.',
      },
      {
        q_ar: 'ما الفرق بين إيجار يومي، شهري، وسنوي؟',
        a_ar: 'الإيجار اليومي هو الأغلى (مناسب لمهام قصيرة <أسبوع). الشهري أرخص بـ 15-20٪. السنوي أرخص بـ 25-35٪ ويشمل عادةً شاحنة بديلة عند الأعطال.',
        q_en: 'What is the difference between daily, monthly, and annual rental?',
        a_en: 'Daily is the most expensive (good for jobs under a week). Monthly is 15–20% cheaper. Annual is 25–35% cheaper and usually includes a replacement truck during breakdowns.',
      },
      {
        q_ar: 'هل يطلب المؤجّر تأمين من المستأجر؟',
        a_ar: 'نعم. تأمين شامل إجباري (1,500-3,000 ر.س/سنة) + مبلغ ضمان 5,000-15,000 ر.س يُسترجع عند إرجاع الشاحنة بحالتها الأصلية.',
        q_en: 'Does the owner require insurance from the renter?',
        a_en: 'Yes. Comprehensive insurance is mandatory (SAR 1,500–3,000/year) plus a refundable deposit of SAR 5,000–15,000 returned when the truck comes back in its original condition.',
      },
      {
        q_ar: 'هل يمكن إيجار الشاحنة بسائق جاهز؟',
        a_ar: 'نعم، معظم شركات التأجير يقدمون سائقين. سعر السائق المسلم (مع إقامة سارية ورخصة عامة) 3,500-5,500 ر.س شهرياً. سائق HAZMAT 7,000-9,000 ر.س.',
        q_en: 'Can I rent a truck with a driver included?',
        a_en: 'Yes, most rental companies offer drivers. A compliant driver (valid iqama and public license) costs SAR 3,500–5,500/month. A HAZMAT driver costs SAR 7,000–9,000.',
      },
    ],
  },
  {
    slug:           'choose-trusted-transport-contractor',
    title_ar:       'كيف تختار مزوّد عقد نقل موثوق في السعودية',
    title_en:       'How to Choose a Trusted Transport Contractor in Saudi Arabia',
    description_ar: 'معايير اختيار مزوّد خدمات النقل: التراخيص، التأمين، الأسطول، المراجعات، الشروط التعاقدية — وكيف تتجنّب الاحتيال.',
    description_en: 'Criteria for choosing a transport service provider: licenses, insurance, fleet, reviews, contract terms — and how to avoid scams.',
    icon:           '🤝',
    updated_at:     '2026-10-25',
    reading_minutes: 8,
    tags:           ['عقود نقل', 'موثوقية', 'تأمين', 'دليل'],
    primary_section: 'contracts',
    tldr_ar:
      'لاختيار مزوّد نقل موثوق في السعودية: اطلب رخصة TGA سارية (مع رقم المنشأة)، تأمين شامل ' +
      'للبضاعة بحد أدنى 1 مليون ريال، 3 مراجع من عملاء حاليين، كشف أسطول (كم شاحنة وأعمارها)، ' +
      'ومسودة عقد SLA واضح. تجنّب من يطلب دفع مقدم كامل، لا يملك عنوان مؤسسة، أو لا يقبل الزيارة الميدانية.',
    tldr_en:
      'To pick a trusted Saudi transport contractor: ask for a valid TGA license (with the entity ' +
      'ID), comprehensive cargo insurance of at least SAR 1M, three live-client references, a fleet ' +
      'disclosure (truck count and ages), and a clear SLA draft. Avoid anyone demanding full ' +
      'upfront payment, lacking a business address, or refusing a site visit.',
    faq: [
      {
        q_ar: 'كيف أتحقق من رخصة مزوّد النقل؟',
        a_ar: 'ادخل على منصة الهيئة العامة للنقل (tga.gov.sa) وتحقّق من رقم رخصة النشاط. الرخصة السارية تحمل اسم المنشأة ورقم السجل التجاري وتاريخ انتهاء ساري.',
        q_en: 'How do I verify a transport contractor\'s license?',
        a_en: 'Go to the Transport General Authority portal (tga.gov.sa) and verify the activity license number. A valid license shows the entity name, commercial registration number, and a current expiry date.',
      },
      {
        q_ar: 'ما حد أدنى معقول لتأمين البضاعة؟',
        a_ar: 'يعتمد على قيمة الشحنة. القاعدة: التأمين يُغطّي 100٪ من قيمة الشحنة أو 1 مليون ر.س كحد أدنى — أيّهما أعلى. اطلب نسخة من بوليصة التأمين قبل التوقيع.',
        q_en: 'What is a reasonable minimum cargo insurance limit?',
        a_en: 'It depends on the shipment value. Rule of thumb: insurance should cover 100% of shipment value or SAR 1 million minimum — whichever is higher. Ask for a copy of the policy before signing.',
      },
      {
        q_ar: 'ما العلامات الحمراء التي تدل على مزوّد نقل مشبوه؟',
        a_ar: 'طلب دفع كامل مقدم، عدم وجود عنوان مؤسسة واضح، رخصة منتهية الصلاحية، رفض تقديم مراجع، شاحنات بلا شعار الشركة، أو عدم استعداد لعقد مكتوب — كلها إشارات لتجنّبه.',
        q_en: 'What red flags indicate a suspicious transport contractor?',
        a_en: 'Demanding full upfront payment, no clear business address, an expired license, refusing to provide references, trucks without company branding, or unwillingness to sign a written contract — all are signs to avoid.',
      },
      {
        q_ar: 'ما البنود الأساسية التي يجب أن أطلبها في عقد النقل؟',
        a_ar: 'جدول رسوم مفصّل، SLA لوقت التسليم، شروط التأخير والتعويض، مسؤولية التلف أو الفقدان، شروط الدفع (نسبة مقدم + باقي عند التسليم)، وآلية فض النزاعات.',
        q_en: 'What essential clauses should I ask for in a transport contract?',
        a_en: 'Detailed fee schedule, delivery-time SLA, delay and compensation terms, damage/loss liability, payment terms (deposit percentage + balance on delivery), and a dispute-resolution mechanism.',
      },
      {
        q_ar: 'كم المدة المناسبة لعقد تجريبي قبل التعاقد السنوي؟',
        a_ar: 'عقد تجريبي 2-3 أشهر مناسب لتقييم الالتزام بالمواعيد ونسبة التلف. تضمينه بند "خروج بدون غرامة" إذا تجاوز معدل التأخير 10٪ أو حدثت 3 حوادث تلف غير مبرّرة.',
        q_en: 'What is a sensible trial duration before signing an annual contract?',
        a_en: 'A 2–3 month trial is sensible for assessing punctuality and damage rate. Include a no-penalty exit clause if the delay rate exceeds 10% or if there are 3 unjustified damage incidents.',
      },
    ],
  },
  {
    slug:           'fixed-vs-spot-transport-contracts',
    title_ar:       'الفرق بين عقد النقل الثابت وعقد Spot: أيهما يناسبك؟',
    title_en:       'Fixed vs Spot Transport Contracts: Which Suits You?',
    description_ar: 'شرح مفصّل للفرق بين العقد الثابت طويل الأمد وعقد spot الفوري — التكاليف، المرونة، المخاطر، ومتى تستخدم كل نوع.',
    description_en: 'Detailed comparison of long-term fixed contracts vs. spot contracts — costs, flexibility, risks, and when to use each.',
    icon:           '⚖️',
    updated_at:     '2026-10-25',
    reading_minutes: 7,
    tags:           ['عقود', 'spot', 'تخطيط لوجستي', 'تكاليف'],
    primary_section: 'contracts',
    tldr_ar:
      'العقد الثابت: سعر محدد مسبقاً لمدة 6-12 شهر، أرخص بـ 15-25٪، مناسب لحجم شحنات يمكن توقعه. ' +
      'عقد Spot: سعر فوري للرحلة الواحدة، أعلى 20-40٪، مناسب للطلبيات غير المتوقعة أو المواسم. ' +
      'الحكمة: 70-80٪ من حجمك على عقد ثابت + 20-30٪ على Spot لامتصاص الذروات.',
    tldr_en:
      'Fixed contract: a locked-in rate for 6–12 months, 15–25% cheaper, best for predictable ' +
      'shipment volume. Spot contract: an on-the-spot rate per trip, 20–40% higher, best for ' +
      'unpredictable orders or peak seasons. Rule of thumb: run 70–80% of your volume on a fixed ' +
      'contract and 20–30% on spot to absorb peaks.',
    faq: [
      {
        q_ar: 'متى يكون العقد الثابت الخيار الأفضل؟',
        a_ar: 'عندما يكون حجم شحناتك ثابتاً وقابل للتنبؤ (مثال: مصنع يرسل 20 شاحنة أسبوعياً لنفس الوجهة). يوفّر 15-25٪ ويضمن توفر الأسطول في أوقات الذروة.',
        q_en: 'When is a fixed contract the better choice?',
        a_en: 'When your shipment volume is steady and predictable (e.g. a factory sending 20 trucks a week to the same destination). It saves 15–25% and guarantees fleet availability during peak times.',
      },
      {
        q_ar: 'ومتى يكون Spot أفضل؟',
        a_ar: 'للشحنات العرضية أو الموسمية (مثال: متجر إلكتروني يحتاج 50 شاحنة في موسم الرياض فقط)، أو عندما تريد اختبار مزوّد جديد قبل الالتزام طويل الأمد.',
        q_en: 'And when is spot better?',
        a_en: 'For occasional or seasonal shipments (e.g. an e-commerce store needing 50 trucks only during Riyadh Season), or when you want to trial a new carrier before committing long-term.',
      },
      {
        q_ar: 'هل أستطيع المزج بين النوعين؟',
        a_ar: 'نعم، وهذه هي الاستراتيجية الأمثل لأغلب الشركات. 70-80٪ من حجمك الأساسي على عقد ثابت (استقرار + سعر منخفض) + 20-30٪ على Spot (مرونة لامتصاص الذروات).',
        q_en: 'Can I mix both contract types?',
        a_en: 'Yes — this is the optimal strategy for most companies. Put 70–80% of your base volume on a fixed contract (stability + low price) and 20–30% on spot (flexibility for peaks).',
      },
      {
        q_ar: 'ما مدة العقد الثابت المعتادة؟',
        a_ar: 'الأشهر 6-12 هي الأكثر شيوعاً. العقود القصيرة (3 أشهر) للاختبار. العقود السنوية+ تتطلب بند مراجعة ربع سنوية للسعر مرتبط بسعر الديزل.',
        q_en: 'What is the typical duration of a fixed contract?',
        a_en: '6–12 months is most common. Short contracts (3 months) are for trials. Annual-plus contracts should include a quarterly price-review clause tied to the diesel price.',
      },
      {
        q_ar: 'هل أستطيع الخروج من عقد ثابت مبكراً؟',
        a_ar: 'يعتمد على بنود العقد. العقود الاحترافية تتضمّن "خروج بإشعار 60 يوم" مقابل غرامة محدودة (شهرين من قيمة العقد عادةً). تجنّب العقود التي تمنع الخروج المبكر مهما كلّف.',
        q_en: 'Can I exit a fixed contract early?',
        a_en: 'It depends on the contract terms. Professional contracts include a "60-day notice exit" against a capped penalty (usually two months of contract value). Avoid contracts that prevent early exit regardless of cost.',
      },
    ],
  },
  {
    slug:           'fleet-financing-saudi-arabia',
    title_ar:       'دليل تمويل الأساطيل في السعودية: البنوك، الإيجار التمويلي، والصكوك',
    title_en:       'Fleet Financing in Saudi Arabia: Banks, Leasing, and Sukuk',
    description_ar: 'مقارنة شاملة بين خيارات تمويل الأساطيل اللوجستية في السعودية: قروض البنوك، الإيجار التمويلي، الصكوك، ومنتجات SIDF.',
    description_en: 'Complete comparison of logistics fleet financing options in Saudi Arabia: bank loans, lease-to-own, sukuk, and SIDF programs.',
    icon:           '🏦',
    updated_at:     '2026-10-25',
    reading_minutes: 9,
    tags:           ['تمويل', 'بنوك', 'صكوك', 'أساطيل', 'SIDF'],
    primary_section: 'ma',
    tldr_ar:
      'ثلاث خيارات رئيسية لتمويل الأساطيل في السعودية: (1) قروض البنوك التجارية (مرابحة 5-7٪ ' +
      'سنوياً، فترة سداد 3-5 سنوات)، (2) الإيجار التمويلي (دفعة مقدمة 10-15٪ + أقساط شهرية، ' +
      'الملكية تنتقل بعد السداد)، (3) صندوق التنمية الصناعية SIDF (دعم حتى 50٪ للمشاريع ' +
      'اللوجستية ضمن رؤية 2030، شروط أصعب لكن تكلفة أدنى 2-3٪).',
    tldr_en:
      'Three main fleet-financing options in Saudi Arabia: (1) commercial bank loans ' +
      '(5–7% Murabaha, 3–5 year term), (2) lease-to-own (10–15% deposit + monthly instalments, ' +
      'ownership transfers after full payment), (3) Saudi Industrial Development Fund (SIDF) — ' +
      'up to 50% support for Vision 2030-aligned logistics projects, stricter conditions but a ' +
      'much lower 2–3% all-in cost.',
    faq: [
      {
        q_ar: 'ما الحد الأدنى للدفعة المقدمة لتمويل شاحنة؟',
        a_ar: 'البنوك التجارية: 20-30٪ من قيمة الشاحنة. الإيجار التمويلي: 10-15٪ فقط. بعض شركات التأجير التمويلي المتخصصة في النقل تقبل 5٪ لعملاء ذوي تاريخ ائتماني ممتاز.',
        q_en: 'What is the minimum down payment for truck financing?',
        a_en: 'Commercial banks: 20–30% of the truck value. Lease-to-own: only 10–15%. Some specialised transport lease companies accept 5% for customers with excellent credit history.',
      },
      {
        q_ar: 'ما الفرق بين قرض البنك والإيجار التمويلي؟',
        a_ar: 'قرض البنك: تصبح مالكاً للشاحنة فوراً وتُقسّط للبنك. الإيجار التمويلي: البنك/الشركة يملكون الشاحنة وأنت تستأجرها، الملكية تنتقل بعد سداد آخر قسط. الإيجار أرخص في البداية لكن أعلى إجمالياً.',
        q_en: 'What is the difference between a bank loan and lease-to-own?',
        a_en: 'Bank loan: you own the truck immediately and pay the bank in instalments. Lease-to-own: the bank/company owns it, you rent, ownership transfers after the last payment. Leasing is cheaper up front but higher in total.',
      },
      {
        q_ar: 'هل صندوق التنمية الصناعية SIDF يمول أساطيل؟',
        a_ar: 'نعم، ضمن مبادرة "مركز لوجستي عالمي" من رؤية 2030. يُغطّي حتى 50٪ من كلفة المشروع للمشاريع التي تدمج تقنية (نظام تتبع GPS، أسطول صديق للبيئة، مركز لوجستي متكامل). الحد الأدنى للمشروع 5 مليون ريال.',
        q_en: 'Does SIDF finance fleets?',
        a_en: 'Yes, under the Vision 2030 "Global Logistics Hub" initiative. It covers up to 50% of project cost for tech-integrated ventures (GPS tracking fleets, green fleets, integrated logistics centres). Minimum project size is SAR 5M.',
      },
      {
        q_ar: 'كم تكلفة فائدة قرض شاحنة في البنوك السعودية؟',
        a_ar: 'الهامش الربحي للمرابحة بين 5-7٪ سنوياً للسجلات التجارية ذات التاريخ الائتماني الجيد. يرتفع إلى 8-10٪ للشركات الناشئة. البنوك الرئيسية: الراجحي، الأهلي، الإنماء، البلاد.',
        q_en: 'What is the interest cost of a truck loan at Saudi banks?',
        a_en: 'The Murabaha profit margin ranges from 5–7% annually for commercial registrations with good credit history, rising to 8–10% for startups. Main providers: Al Rajhi, SNB, Alinma, Albilad.',
      },
      {
        q_ar: 'هل أستطيع تمويل أسطول من 10 شاحنات دفعة واحدة؟',
        a_ar: 'نعم، البنوك تُفضّل تمويل الأساطيل على الوحدات المنفردة (أقل تكلفة إدارية). الدفعة المقدمة غالباً تنخفض إلى 15٪ لأساطيل 10+ شاحنات، مع هامش ربح أقل 0.5-1٪.',
        q_en: 'Can I finance a 10-truck fleet in one transaction?',
        a_en: 'Yes — banks prefer fleet financing over single units (lower admin cost). Down payment often drops to 15% for 10+ truck fleets, with a profit margin 0.5–1% lower.',
      },
    ],
  },
  {
    slug:           'driver-licensing-saudi-arabia',
    title_ar:       'تراخيص قيادة الشاحنات في السعودية: الفئات، المتطلبات، والرسوم',
    title_en:       'Truck Driver Licensing in Saudi Arabia: Classes, Requirements, Fees',
    description_ar: 'دليل تراخيص قيادة الشاحنات في السعودية — الفئات الخامسة والسادسة، شهادات HAZMAT، التجديد، والاعتمادات المهنية.',
    description_en: 'Saudi truck driver licensing guide — class 5 and 6, HAZMAT certifications, renewals, and professional accreditations.',
    icon:           '🪪',
    updated_at:     '2026-10-24',
    reading_minutes: 6,
    tags:           ['سائقون', 'تراخيص قيادة', 'فئة خامسة', 'HAZMAT'],
    primary_section: 'jobs',
    tldr_ar:
      'تنقسم رخص قيادة الشاحنات في السعودية إلى فئتين رئيسيتين: الفئة الخامسة ' +
      '(شاحنة متوسطة حتى 12 طن) والفئة السادسة (شاحنة ثقيلة فوق 12 طن أو قاطرة). ' +
      'تتطلب كل فئة اختبار نظري + عملي ودورة في مدرسة قيادة معتمدة، وتُصدر الرخصة ' +
      'لـ 10 سنوات. نقل المواد الخطرة يحتاج شهادة HAZMAT إضافية من TGA.',
    tldr_en:
      'Saudi truck licenses split into two main classes: Class 5 (medium trucks up to 12 t) ' +
      'and Class 6 (heavy trucks over 12 t or articulated). Each requires a theory + practical ' +
      'exam and a certified driving-school course; the license is issued for 10 years. ' +
      'Hazardous materials transport needs an additional TGA HAZMAT certificate.',
    faq: [
      {
        q_ar: 'ما الفرق بين رخصة القيادة الخامسة والسادسة؟',
        a_ar: 'الفئة الخامسة تُجيز قيادة الشاحنات المتوسطة حتى 12 طن إجمالي. الفئة السادسة تشمل الشاحنات الثقيلة فوق 12 طن أو الشاحنات القاطرة (نصف نقل + مقطورة). الفئة السادسة تتطلب خبرة مسبقة بالفئة الخامسة.',
        q_en: 'What is the difference between a Class 5 and Class 6 driver license?',
        a_en: 'Class 5 permits medium trucks up to 12 tonnes total weight. Class 6 covers heavy trucks over 12 tonnes or articulated semi-trucks with trailers; it also requires prior Class 5 experience.',
      },
      {
        q_ar: 'كم تكلفة إصدار رخصة قيادة شاحنة في السعودية؟',
        a_ar: 'الرسوم الحكومية 400 ر.س لكل 10 سنوات. تُضاف تكلفة دورة مدرسة القيادة (1,500-3,500 ر.س حسب المدرسة) + الفحص الطبي (~300 ر.س).',
        q_en: 'How much does a Saudi truck driver license cost?',
        a_en: 'Government fee is SAR 400 for 10 years. Add the driving-school course (SAR 1,500–3,500 depending on the school) and a medical exam (~SAR 300).',
      },
      {
        q_ar: 'هل يستطيع المقيم غير السعودي استخراج رخصة قيادة شاحنة؟',
        a_ar: 'نعم. المقيم بإقامة سارية يستطيع التقديم، ويحتاج موافقة صاحب العمل + فحص طبي + دورة مدرسة قيادة معتمدة. المدة الإجمالية ~30 يوم.',
        q_en: 'Can non-Saudi residents get a truck driver license?',
        a_en: 'Yes. Residents with valid iqama can apply, provided their employer approves plus a medical exam and a certified driving-school course. Full process takes ~30 days.',
      },
      {
        q_ar: 'ما شهادة HAZMAT ومتى أحتاجها؟',
        a_ar: 'شهادة HAZMAT (المواد الخطرة) تصدرها الهيئة العامة للنقل. مطلوبة لنقل الوقود والمواد الكيماوية والغازات المضغوطة والمواد المشعة. تتطلب دورة متخصصة لمدة 3-5 أيام + اختبار سنوي.',
        q_en: 'What is HAZMAT certification and when do I need it?',
        a_en: 'A HAZMAT certificate from the TGA, required for transporting fuel, chemicals, compressed gases, and radioactive materials. It needs a specialised 3–5 day course and an annual exam.',
      },
      {
        q_ar: 'كيف أجدد رخصة قيادة الشاحنة؟',
        a_ar: 'عبر تطبيق أبشر أو منصة التجارة. الرسوم 400 ر.س. يُشترط عدم وجود مخالفات مرورية غير مسددة + فحص طبي حديث للسائقين فوق سن 60.',
        q_en: 'How do I renew my truck driver license?',
        a_en: 'Through the Absher app or the Commerce portal. Fee is SAR 400. Requires no unpaid traffic violations plus a recent medical exam for drivers over 60.',
      },
    ],
  },
  {
    slug:           'cold-chain-logistics-saudi-arabia',
    title_ar:       'سلسلة التبريد في السعودية: متطلبات نقل الأدوية والأغذية',
    title_en:       'Cold Chain Logistics in Saudi Arabia: Pharma and Food Transport',
    description_ar: 'كل ما تحتاج معرفته عن نقل المواد المبرّدة في السعودية — اشتراطات SFDA، أنظمة التتبع، التأمين، وأسعار السوق.',
    description_en: 'Everything you need to know about refrigerated transport in Saudi Arabia — SFDA requirements, tracking systems, insurance, and market pricing.',
    icon:           '❄️',
    updated_at:     '2026-10-25',
    reading_minutes: 8,
    tags:           ['سلسلة التبريد', 'نقل مبرّد', 'SFDA', 'أدوية', 'أغذية'],
    primary_section: 'fleet',
    tldr_ar:
      'نقل المواد المبرّدة في السعودية يخضع للهيئة العامة للغذاء والدواء (SFDA). المتطلبات ' +
      'الأساسية: شاحنة مبرّدة GDP-certified، نظام تسجيل حرارة متواصل (data logger)، شهادة ' +
      'سائق مُدرّب على سلسلة التبريد، وتأمين خاص بالأدوية (حد 2-5 مليون ر.س). ثلاث مستويات حرارة: ' +
      'مبرّد (+2 إلى +8°م)، مجمّد (-18°م)، مجمّد عميق (-25°م).',
    tldr_en:
      'Refrigerated transport in Saudi Arabia falls under the Saudi FDA. Core requirements: ' +
      'a GDP-certified reefer truck, a continuous temperature data logger, a driver certified ' +
      'in cold-chain handling, and dedicated pharma insurance (SAR 2–5M limit). Three temperature ' +
      'bands: chilled (+2 to +8°C), frozen (-18°C), deep-frozen (-25°C).',
    faq: [
      {
        q_ar: 'ما شهادات SFDA المطلوبة لنقل الأدوية؟',
        a_ar: 'شهادة GDP (ممارسات التوزيع الجيدة) للمنشأة + شهادة GSP لتخزين الأدوية في المستودع + شهادة سائق مُعتمد. التجديد سنوي، والمخالفة قد تؤدي لإغلاق النشاط.',
        q_en: 'What SFDA certifications are required for pharmaceutical transport?',
        a_en: 'GDP (Good Distribution Practice) certification for the entity, GSP for drug storage in the warehouse, and a certified-driver credential. Renewal is annual and a breach can shut the business down.',
      },
      {
        q_ar: 'كم تكلفة شاحنة مبرّدة إضافية مقارنة بالعادية؟',
        a_ar: 'شاحنة مبرّدة 10 طن جديدة تبدأ من 280-400 ألف ر.س، بينما العادية 180-250 ألف. التكلفة الإضافية 100-150 ألف لنظام التبريد + العزل. سعر الإيجار أعلى 30-45٪.',
        q_en: 'How much more does a refrigerated truck cost vs a regular one?',
        a_en: 'A new 10-tonne reefer truck starts at SAR 280–400k, versus SAR 180–250k for a standard truck — an added SAR 100–150k for the chiller unit and insulation. Rental rates run 30–45% higher.',
      },
      {
        q_ar: 'ما مخاطر انقطاع سلسلة التبريد وكيف أحمي شحنتي؟',
        a_ar: 'انقطاع التبريد يفسد الأدوية (خسارة كاملة) أو يُقلّل مدة صلاحية الأغذية. الحماية: data logger بإنذار فوري، شاحنة بديلة في خطة الطوارئ، تأمين يُغطّي خسائر التلف الحراري.',
        q_en: 'What are the risks of a broken cold chain and how do I protect my shipment?',
        a_en: 'A broken cold chain spoils medicines (total loss) or shortens food shelf life. Mitigate with a data logger that triggers instant alerts, a contingency replacement truck, and insurance that covers heat-damage losses.',
      },
      {
        q_ar: 'ما نظام التتبع المعتمد في SFDA؟',
        a_ar: 'نظام تسجيل درجة حرارة مستمر مع ذاكرة لا تقل عن 90 يوماً. GPS للموقع مُدمج مع التبريد. التقارير يجب أن تكون قابلة للطباعة وتُقدَّم لـ SFDA عند التفتيش.',
        q_en: 'What tracking system is SFDA-approved?',
        a_en: 'A continuous temperature logger with at least 90-day memory, GPS integrated with the chiller unit, and printable reports that can be presented to SFDA during inspection.',
      },
      {
        q_ar: 'هل تختلف اشتراطات نقل الأغذية عن الأدوية؟',
        a_ar: 'نعم. الأدوية أكثر صرامة (GDP + تدقيق دوري من SFDA). الأغذية تحتاج فقط ترخيص بلدي + نظافة الشاحنة. لكن المواد الحساسة (لحوم، ألبان) تحتاج تبريد متواصل مع تسجيل حرارة.',
        q_en: 'Are food transport requirements different from pharma?',
        a_en: 'Yes. Pharma is stricter (GDP + periodic SFDA audits). Food only needs a municipal licence plus truck hygiene — but sensitive goods (meat, dairy) still require continuous cooling with temperature logging.',
      },
    ],
  },
  {
    slug:           'last-mile-delivery-saudi-arabia',
    // Meta rewritten 2026-09 based on GSC: 51 impressions for the query
    // "saudi arabia on-demand delivery market" landed on this article with
    // 0 clicks. Description now front-loads the exact query terms
    // ("on-demand delivery market", "3.2 billion") to boost SERP CTR.
    title_ar:       'سوق توصيل الميل الأخير والطلب الفوري في السعودية 2026: حجم 3.2 مليار ريال وفرص النمو 30%',
    title_en:       'Saudi Arabia On-Demand Delivery Market 2026: SAR 3.2B Size, Last-Mile Trends & Growth Opportunities',
    description_ar: 'تحليل شامل لسوق توصيل الميل الأخير والطلب الفوري (on-demand) في السعودية 2026: حجم 3.2 مليار ريال، نمو 30% سنوياً، اللاعبون الرئيسيون، وفرص للناقلين الصغار.',
    description_en: 'Complete 2026 analysis of the Saudi Arabia on-demand delivery market: SAR 3.2B size, 30% annual growth, last-mile players, market share, and entry opportunities for small carriers.',
    icon:           '📦',
    updated_at:     '2026-10-25',
    reading_minutes: 8,
    tags:           ['الميل الأخير', 'on-demand delivery', 'E-commerce', 'توصيل', 'saudi arabia'],
    primary_section: 'contracts',
    tldr_ar:
      'سوق توصيل الميل الأخير والطلب الفوري في السعودية يبلغ 3.2 مليار ريال في 2026 بنمو ' +
      'سنوي 30٪. اللاعبون الكبار: جاهز، HungerStation، طلبات، أمازون KSA، نون. العتبة الدنيا ' +
      'للدخول: 10-20 مركبة توصيل + تطبيق تتبع. متوسط هامش الربح للمتعاقدين الصغار 15-22٪ على ' +
      'الطلبية. أعلى فرصة في المدن الصغيرة (الخرج، الطائف، تبوك) حيث منافسة أقل.',
    tldr_en:
      'Saudi Arabia\'s on-demand and last-mile delivery market reaches SAR 3.2B in 2026, ' +
      'growing 30% annually. Big players: Jahez, HungerStation, Talabat, Amazon KSA, Noon. ' +
      'Minimum entry: 10–20 delivery vehicles + a tracking app. Small subcontractors earn ' +
      '15–22% per order. Highest opportunity is in secondary cities (Kharj, Taif, Tabuk) ' +
      'where competition is thinner.',
    faq: [
      {
        q_ar: 'ما حجم سوق التوصيل بالطلب في السعودية؟',
        a_ar: '3.2 مليار ريال في 2026، متوقع يصل إلى 5+ مليار بحلول 2028. 65٪ من الحجم في الرياض وجدة والدمام. التوصيل الفوري (<30 دقيقة) ينمو بأسرع معدل (40٪ سنوياً).',
        q_en: 'How large is the on-demand delivery market in Saudi Arabia?',
        a_en: 'SAR 3.2B in 2026, expected to exceed SAR 5B by 2028. 65% of volume concentrates in Riyadh, Jeddah, and Dammam. Instant delivery (under 30 minutes) is the fastest-growing segment at 40% a year.',
      },
      {
        q_ar: 'ما العتبة الدنيا للدخول كمتعاقد توصيل؟',
        a_ar: '10-20 مركبة توصيل (سيارات أو دراجات نارية)، تطبيق تتبع (أو تكامل مع تطبيق المنصة)، فريق تشغيل 2-3 أشخاص، وتأمين على المركبات والسائقين. رأس المال التأسيسي 150-400 ألف ر.س.',
        q_en: 'What is the minimum entry threshold for a delivery subcontractor?',
        a_en: '10–20 delivery vehicles (cars or motorbikes), a tracking app (or integration with the platform\'s app), a 2–3 person ops team, and vehicle + driver insurance. Startup capital runs SAR 150–400k.',
      },
      {
        q_ar: 'ما متوسط هامش ربح المتعاقد الصغير؟',
        a_ar: '15-22٪ على كل طلبية بعد خصم رواتب السائقين، وقود، وتأمين، وصيانة. المدن الكبرى هامش أقل (12-18٪) بسبب المنافسة. المدن المتوسطة والصغيرة 20-25٪.',
        q_en: 'What is the typical margin for a small subcontractor?',
        a_en: '15–22% per order after driver wages, fuel, insurance, and maintenance. Major cities earn less (12–18%) due to competition; secondary and smaller cities earn 20–25%.',
      },
      {
        q_ar: 'كيف أحصل على عقد مع منصة مثل جاهز أو HungerStation؟',
        a_ar: 'التسجيل عبر بوابة الشركاء التجاريين على موقع كل منصة. يُطلب: سجل تجاري، كشف الأسطول، شهادات السائقين. المدة من 2-6 أسابيع. ابدأ بمدينة واحدة ثم توسّع.',
        q_en: 'How do I secure a contract with a platform like Jahez or HungerStation?',
        a_en: 'Sign up through each platform\'s partner portal. Required documents: commercial registration, fleet disclosure, driver certifications. Process takes 2–6 weeks. Start with one city and expand.',
      },
      {
        q_ar: 'ما تحديات هذا السوق التي يجب أن أعرفها؟',
        a_ar: 'ارتفاع دوران السائقين (30-50٪ سنوياً)، منافسة سعرية حادة من اللاعبين الكبار، تكاليف الوقود المتقلبة، وضغط المواعيد (SLA صارم 30-45 دقيقة). النجاح يأتي من كفاءة التشغيل.',
        q_en: 'What are the main challenges I should know about?',
        a_en: 'High driver churn (30–50% a year), aggressive price competition from the big players, volatile fuel costs, and tight time pressure (30–45 minute SLAs). Success comes from operational efficiency.',
      },
    ],
  },
  {
    slug:           'hazmat-transport-license-saudi-arabia',
    title_ar:       'ترخيص نقل المواد الخطرة (HAZMAT) في السعودية 2026: الاشتراطات والأسعار',
    title_en:       'HAZMAT Transport License in Saudi Arabia 2026: Requirements and Pricing',
    description_ar: 'دليل كامل لترخيص نقل المواد الخطرة في السعودية 2026: اشتراطات ADR، تدريب السائقين، التأمين بحد 5 مليون ريال، رواتب سائقي HAZMAT، وعقود أرامكو وسابك.',
    description_en: 'Complete 2026 guide to HAZMAT transport licensing in Saudi Arabia: ADR requirements, driver training, SAR 5M insurance coverage, HAZMAT driver salaries, and Aramco/SABIC contracts.',
    icon:           '☢️',
    updated_at:     '2026-10-25',
    reading_minutes: 8,
    tags:           ['HAZMAT', 'نقل مواد خطرة', 'ADR', 'أرامكو', 'تراخيص السعودية'],
    primary_section: 'fleet',
    tldr_ar:
      'ترخيص HAZMAT في السعودية يتبع معيار ADR الأوروبي. المتطلبات: شاحنة متخصصة (صهريج أو ' +
      'شاحنة مغلقة بمواصفات مُحددة)، سائق بشهادة ADR معتمدة من TGA، تأمين بحد 5 مليون ر.س، ' +
      'ومستشار سلامة للمنشأة. التكلفة الإجمالية للتأسيس 150-300 ألف ر.س. سائق HAZMAT يتقاضى ' +
      '8,500-12,000 ر.س شهرياً. أرباح العقد ثلاث أضعاف النقل العادي.',
    tldr_en:
      'HAZMAT licensing in Saudi Arabia follows the European ADR standard. Requirements: ' +
      'a specialised truck (tanker or purpose-built enclosed), a driver with a TGA-issued ADR ' +
      'certificate, SAR 5M insurance coverage, and a certified safety advisor for the business. ' +
      'Total setup cost runs SAR 150–300k. HAZMAT drivers earn SAR 8,500–12,000/month. Contract ' +
      'margins are 3× standard freight.',
    faq: [
      {
        q_ar: 'ما الفئات المصنّفة كمواد خطرة في السعودية؟',
        a_ar: '9 فئات ADR: المتفجرات، الغازات المضغوطة، السوائل القابلة للاشتعال (ديزل، بنزين)، المواد الصلبة القابلة للاشتعال، الأكسدة، السامة، المشعة، الأكّالة، والمتنوعة (بطاريات ليثيوم، إلخ).',
        q_en: 'What classes count as hazardous materials in Saudi Arabia?',
        a_en: 'The 9 ADR classes: explosives, compressed gases, flammable liquids (diesel, petrol), flammable solids, oxidising substances, toxic materials, radioactive, corrosive, and miscellaneous (lithium batteries, etc.).',
      },
      {
        q_ar: 'كم تكلفة شاحنة صهريج HAZMAT؟',
        a_ar: 'صهريج جديد سعة 20,000 لتر مطابق لمواصفات ADR يبدأ من 850 ألف-1.2 مليون ر.س. مستعمل في حالة ممتازة 450-700 ألف. يحتاج فحص سنوي + شهادة سلامة من TGA (رسوم ~3,500 ر.س/سنة).',
        q_en: 'How much does a HAZMAT tanker truck cost?',
        a_en: 'A new ADR-compliant 20,000 L tanker starts at SAR 850k–1.2M. A used tanker in excellent condition runs SAR 450–700k. It requires annual inspection and a TGA safety certificate (~SAR 3,500/year).',
      },
      {
        q_ar: 'ما حد التأمين المطلوب لنقل HAZMAT؟',
        a_ar: 'الحد الأدنى 5 مليون ر.س شامل تأمين المسؤولية البيئية. التأمين الموسّع لـ 10-20 مليون للمواد عالية الخطورة (مواد مشعة، متفجرات). التكلفة السنوية 25-80 ألف ر.س.',
        q_en: 'What insurance limit is required for HAZMAT transport?',
        a_en: 'Minimum SAR 5M including environmental-liability cover. Enhanced cover of SAR 10–20M for high-risk materials (radioactive, explosives). Annual cost: SAR 25–80k.',
      },
      {
        q_ar: 'هل تدخل عقود أرامكو وسابك في نقل HAZMAT؟',
        a_ar: 'نعم، وهي أكبر عقود السوق. تتطلب شروط إضافية فوق ADR: نظام SAP ERP، سائقين سعوديين، فحص دوري من Aramco Vendor Qualification، وقدرة أسطول 20+ شاحنة.',
        q_en: 'Do Aramco and SABIC contracts cover HAZMAT transport?',
        a_en: 'Yes — these are the market\'s largest contracts. They demand extras beyond ADR: SAP ERP integration, Saudi drivers, periodic Aramco Vendor Qualification audits, and a 20+ truck fleet capacity.',
      },
      {
        q_ar: 'كم المدة لإصدار ترخيص HAZMAT جديد؟',
        a_ar: '3-6 أشهر إجمالاً. المراحل: تدريب السائقين (3-5 أيام)، فحص الأسطول من TGA، مراجعة ملف السلامة، تفتيش ميداني. التأخير الشائع في مطابقة الصهاريج والمستودعات.',
        q_en: 'How long does it take to get a new HAZMAT license?',
        a_en: '3–6 months total. Stages: driver training (3–5 days), TGA fleet inspection, safety file review, and a field inspection. Common delay source is tank and warehouse compliance.',
      },
    ],
  },
  {
    slug:           'air-cargo-shipping-saudi-arabia',
    title_ar:       'الشحن الجوي من السعودية 2026: الأسعار، المطارات، والمستندات',
    title_en:       'Air Cargo Shipping from Saudi Arabia 2026: Rates, Airports, Documentation',
    description_ar: 'دليل شامل للشحن الجوي من السعودية 2026: أسعار الشحن من مطارات الرياض وجدة والدمام لكل الوجهات الرئيسية، مستندات AWB والجمارك، والشحن المبرّد جواً.',
    description_en: 'Complete 2026 air cargo guide from Saudi Arabia: shipping rates from Riyadh, Jeddah, and Dammam airports to all major destinations, AWB and customs documentation, and cold-chain air freight.',
    icon:           '✈️',
    updated_at:     '2026-10-25',
    reading_minutes: 9,
    tags:           ['شحن جوي', 'air cargo', 'مطار الملك خالد', 'AWB', 'saudi airports'],
    primary_section: 'contracts',
    tldr_ar:
      'ثلاث مطارات رئيسية للشحن الجوي من السعودية: الملك خالد (الرياض — RUH)، الملك عبدالعزيز ' +
      '(جدة — JED)، الملك فهد (الدمام — DMM). متوسط السعر 8-15 ر.س/كجم لأوروبا، 12-22 ر.س/كجم ' +
      'لأمريكا، 5-10 ر.س/كجم لآسيا. المستند الرئيسي بوليصة شحن جوية (AWB). مدة التسليم 1-3 أيام ' +
      'لأغلب الوجهات. سعودية للشحن الجوي (Saudia Cargo) هي الناقل الرئيسي.',
    tldr_en:
      'Three main cargo airports in Saudi Arabia: King Khalid (Riyadh — RUH), King Abdulaziz ' +
      '(Jeddah — JED), King Fahd (Dammam — DMM). Average rates: SAR 8–15/kg to Europe, ' +
      'SAR 12–22/kg to the Americas, SAR 5–10/kg to Asia. The core document is the Air Waybill ' +
      '(AWB). Transit time is 1–3 days to most destinations. Saudia Cargo is the dominant carrier.',
    faq: [
      {
        q_ar: 'ما أرخص وجهة شحن جوي من السعودية؟',
        a_ar: 'الوجهات الآسيوية (دبي، الكويت، الدوحة) الأرخص: 3-6 ر.س/كجم. دول الخليج تعتبر "شحن داخلي" إقليمياً مع أسعار منخفضة. السفر لأمريكا الجنوبية الأغلى (20-35 ر.س/كجم).',
        q_en: 'What is the cheapest air-cargo destination from Saudi Arabia?',
        a_en: 'Nearby Asian destinations (Dubai, Kuwait, Doha) are cheapest at SAR 3–6/kg. GCC countries count as "regional domestic" with low rates. South America is the most expensive at SAR 20–35/kg.',
      },
      {
        q_ar: 'ما بوليصة الشحن الجوي AWB وأين أحصل عليها؟',
        a_ar: 'بوليصة الشحن الجوي (Air Waybill) هي العقد بين الشاحن والناقل. تُصدَر من الناقل أو وكيل الشحن المعتمد (freight forwarder). رقمها 11 خانة ويُستخدم للتتبع ومستندات الجمارك.',
        q_en: 'What is an Air Waybill (AWB) and where do I get one?',
        a_en: 'The Air Waybill is the contract between shipper and carrier. Issued by the airline or an accredited freight forwarder. It carries an 11-digit number used for tracking and customs documentation.',
      },
      {
        q_ar: 'ما الفرق بين الشحن الجوي العادي والسريع (express)؟',
        a_ar: 'العادي: مدة 2-5 أيام، سعر منخفض. السريع (express): 1-2 يوم، سعر أعلى 40-80٪. السريع المضمون (Guaranteed next flight) الأعلى، للشحنات الطبية والطارئة فقط.',
        q_en: 'What is the difference between standard and express air freight?',
        a_en: 'Standard: 2–5 days, lower rate. Express: 1–2 days, 40–80% higher. Guaranteed next-flight is the top tier, reserved for urgent medical and emergency shipments.',
      },
      {
        q_ar: 'كيف يختلف شحن المواد المبرّدة جواً؟',
        a_ar: 'يحتاج حاوية مبرّدة متخصصة (Cool Container) من الناقل، شهادة GDP للمواد الدوائية، نظام مراقبة حرارة متواصل. السعر أعلى 50-100٪ من الشحن العادي. مطارا الرياض وجدة الوحيدان بإمكانيات كاملة.',
        q_en: 'How is cold-chain air freight different?',
        a_en: 'It requires a specialised Cool Container from the carrier, GDP certification for pharmaceuticals, and continuous temperature monitoring. Costs 50–100% more than standard freight. Only Riyadh and Jeddah have full capability.',
      },
      {
        q_ar: 'ما البضائع الممنوعة من الشحن الجوي؟',
        a_ar: 'البطاريات الليثيوم الكبيرة (فوق 100 واط-ساعة بدون شهادات)، المواد المتفجرة والسامة بدون ترخيص HAZMAT، النقود، المخدرات، الحيوانات بدون موافقة الجهات المختصة. راجع IATA DGR قبل الشحن.',
        q_en: 'What goods are prohibited for air freight?',
        a_en: 'Large lithium batteries (over 100 Wh without certification), explosives and toxic materials without a HAZMAT licence, cash, narcotics, and animals without competent-authority approval. Check IATA DGR before shipping.',
      },
    ],
  },
  {
    slug:           'warehouse-rental-riyadh',
    title_ar:       'إيجار المستودعات في الرياض 2026: الأسعار، المناطق، والأنواع',
    title_en:       'Warehouse Rental in Riyadh 2026: Prices, Districts, and Types',
    description_ar: 'دليل شامل لإيجار المستودعات اللوجستية في الرياض 2026: أسعار المتر المربع في السلي، سلبوخ، طريق الخرج. مستودعات جافة، مبردة، وجمركية.',
    description_en: 'Complete 2026 guide to logistics warehouse rental in Riyadh: SAR per sqm in Sulai, Salboukh, Kharj Road. Dry, cold-storage, and bonded warehouses.',
    icon:           '🏭',
    updated_at:     '2026-10-25',
    reading_minutes: 8,
    tags:           ['مستودعات الرياض', 'warehouse rental', 'السلي', 'سلبوخ', 'مستودعات جمركية'],
    primary_section: 'contracts',
    tldr_ar:
      'أسعار إيجار المستودعات اللوجستية في الرياض 2026: السلي 120-180 ر.س/م²/سنة، سلبوخ ' +
      '95-140 ر.س/م²/سنة، طريق الخرج 85-130 ر.س/م²/سنة. المستودعات المبرّدة أعلى بـ 70-120٪. ' +
      'المستودعات الجمركية (Bonded) تحتاج ترخيص خاص من الجمارك وتقع قرب المطارات. العقود السنوية ' +
      'الأرخص؛ 3+ سنوات تخفض 10-15٪ إضافية. المستأجر يدفع عادة الكهرباء والصيانة.',
    tldr_en:
      'Riyadh logistics warehouse rental rates (2026): Sulai SAR 120–180/sqm/year, Salboukh ' +
      'SAR 95–140, Kharj Road SAR 85–130. Cold-storage runs 70–120% higher. Bonded warehouses ' +
      'need special customs licensing and sit near airports. Annual contracts are cheapest; 3+ ' +
      'year leases cut 10–15% further. Tenants typically pay electricity and maintenance.',
    faq: [
      {
        q_ar: 'ما أرخص منطقة لمستودع في الرياض؟',
        a_ar: 'طريق الخرج والمزاحمية الأرخص (85-130 ر.س/م²). طريق الدمام متوسط. السلي الأغلى لقربه من وسط المدينة. اختر بناءً على موقع عملائك وتكلفة التوصيل أهم من إيجار المستودع نفسه.',
        q_en: 'What is the cheapest area for warehousing in Riyadh?',
        a_en: 'Kharj Road and Al-Muzahimiyyah are cheapest (SAR 85–130/sqm). Dammam Road is mid-range. Sulai is most expensive due to proximity to the city centre. Choose based on your client locations — delivery cost usually outweighs rent.',
      },
      {
        q_ar: 'ما الفرق بين مستودع جاف ومبرّد وجمركي؟',
        a_ar: 'جاف (dry): للبضائع العادية، أرخص. مبرّد (cold storage): للأغذية والأدوية، نظام تبريد 2-8°م، أغلى 70-120٪. جمركي (bonded): للبضائع المستوردة تحت إشراف الجمارك، يحتاج ترخيص خاص وموقع قرب المطار/الميناء.',
        q_en: 'What is the difference between dry, cold-storage, and bonded warehouses?',
        a_en: 'Dry: standard goods, cheapest. Cold storage: food and pharma, 2–8°C system, 70–120% more expensive. Bonded: imported goods under customs supervision, requires a special licence and a location near an airport or port.',
      },
      {
        q_ar: 'كم الحد الأدنى للمساحة التي يمكن إيجارها؟',
        a_ar: '300-500 م² عادةً للمستودعات الصغيرة. بعض المجمّعات الحديثة توفّر وحدات 150 م². المستودعات الكبيرة تبدأ من 2,000 م² وتصل إلى 50,000+ م² للعمليات الصناعية.',
        q_en: 'What is the minimum rentable warehouse size?',
        a_en: 'Usually 300–500 sqm for small warehouses. Some modern complexes offer 150 sqm units. Large warehouses start at 2,000 sqm and reach 50,000+ sqm for industrial operations.',
      },
      {
        q_ar: 'هل الإيجار يشمل الكهرباء والصيانة؟',
        a_ar: 'العقود القياسية: إيجار فقط. المستأجر يدفع كهرباء وماء وصيانة داخلية والتأمين. العقود الشاملة (Triple-Net) تضيف 30-45٪ لكنها تريح من إدارة التفاصيل. تأكد من قراءة العقد بعناية.',
        q_en: 'Does the rent include utilities and maintenance?',
        a_en: 'Standard contracts: rent only. Tenants pay electricity, water, interior maintenance, and insurance. Triple-net all-inclusive contracts add 30–45% but offload the admin overhead. Read the contract carefully.',
      },
      {
        q_ar: 'ما مواصفات المستودع اللوجستي الحديث؟',
        a_ar: 'ارتفاع سقف 10-14م (لـ Vertical Racking)، أرضية مُسلّحة (3-5 طن/م²)، أبواب تحميل (dock doors) بارتفاع 1.2م لمطابقة الشاحنات، إضاءة LED، تهوية مناسبة، ونظام رش حريق مُعتمد من الدفاع المدني.',
        q_en: 'What are modern logistics warehouse specifications?',
        a_en: 'Ceiling height 10–14m (for vertical racking), reinforced floor (3–5 t/sqm), loading dock doors at 1.2m to match trucks, LED lighting, proper ventilation, and a Civil Defense-approved sprinkler system.',
      },
    ],
  },
  {
    slug:           'heavy-equipment-transport-saudi-arabia',
    title_ar:       'نقل المعدات الثقيلة في السعودية 2026: التصاريح، الأسعار، والتخطيط',
    title_en:       'Heavy Equipment Transport in Saudi Arabia 2026: Permits, Prices, Route Planning',
    description_ar: 'دليل نقل المعدات الثقيلة والحفارات والكرينات في السعودية 2026: تصاريح النقل الاستثنائي، أسعار نقل البلدوزر والحفارة، تخطيط المسارات، والتأمين المطلوب.',
    description_en: 'Guide to heavy equipment transport in Saudi Arabia 2026: oversized load permits, bulldozer and excavator transport pricing, route planning, and required insurance coverage.',
    icon:           '🏗️',
    updated_at:     '2026-10-25',
    reading_minutes: 8,
    tags:           ['نقل معدات ثقيلة', 'heavy equipment', 'تصاريح نقل استثنائي', 'كرينات', 'حفارات'],
    primary_section: 'fleet',
    tldr_ar:
      'نقل المعدات الثقيلة في السعودية يحتاج تصريح نقل استثنائي من المرور لكل حمولة تتجاوز ' +
      '2.6م عرضاً أو 4.5م ارتفاعاً أو 100 طن وزناً. تصدر التصاريح خلال 3-7 أيام عمل. ' +
      'متوسط تكلفة النقل: حفارة 20 طن 2,500-4,000 ر.س/300كم، بلدوزر D8 5,000-8,000 ر.س. ' +
      'المركبة الناقلة Lowbed أو Trailer متخصصة. تأمين لازم بحد 2 مليون ر.س+ ومرشد سلامة ' +
      'للحمولات فوق 60 طن.',
    tldr_en:
      'Heavy-equipment transport in Saudi Arabia requires an oversized-load permit from Traffic ' +
      'Police for any load over 2.6m wide, 4.5m high, or 100t gross. Permits issue in 3–7 ' +
      'business days. Typical rates: a 20t excavator SAR 2,500–4,000 per 300 km; a D8 bulldozer ' +
      'SAR 5,000–8,000. Transport uses a lowbed trailer or specialised float. Insurance of ' +
      'SAR 2M+ is mandatory, and a safety escort is required for loads over 60t.',
    faq: [
      {
        q_ar: 'ما تصاريح نقل المعدات الثقيلة في السعودية؟',
        a_ar: 'تصريح النقل الاستثنائي من الإدارة العامة للمرور يُصدر للحمولات التي تتجاوز حدود السير العادية. يُطلب لكل رحلة مع تحديد المسار. الرسوم 500-2,500 ر.س حسب الحجم والمسافة.',
        q_en: 'What permits are needed for heavy equipment transport in Saudi Arabia?',
        a_en: 'An oversized-load permit from the General Directorate of Traffic, issued per trip with a specified route for loads exceeding standard limits. Fees run SAR 500–2,500 depending on size and distance.',
      },
      {
        q_ar: 'كم تكلفة نقل حفارة من الرياض إلى جدة؟',
        a_ar: 'حفارة متوسطة 20 طن تُنقل بـ 8,000-12,000 ر.س شاملاً التصريح والتأمين والمرافق للرحلات الثقيلة. حفارة كبيرة 40 طن 15,000-22,000 ر.س. السعر يرتفع 30-40٪ في المواسم الذروة.',
        q_en: 'How much does it cost to transport an excavator from Riyadh to Jeddah?',
        a_en: 'A mid-sized 20t excavator costs SAR 8,000–12,000 including permit, insurance, and escort for heavy loads. A large 40t excavator costs SAR 15,000–22,000. Rates rise 30–40% in peak seasons.',
      },
      {
        q_ar: 'ما نوع الشاحنة المناسبة للمعدات الثقيلة؟',
        a_ar: 'Lowbed Trailer (مقطورة منخفضة) للحمولات الطويلة والمنخفضة. Multi-axle Float (قاطرة متعددة المحاور) للحمولات فوق 80 طن. Hydraulic Modular Trailer (الأغلى) للحمولات الاستثنائية 150+ طن.',
        q_en: 'What truck type is suitable for heavy equipment?',
        a_en: 'Lowbed trailer for long, low loads. Multi-axle float for loads over 80 tonnes. Hydraulic Modular Trailer (the most expensive) for exceptional loads of 150+ tonnes.',
      },
      {
        q_ar: 'متى يتطلب النقل مرافقة أمنية أو مرشد سلامة؟',
        a_ar: 'إلزامي للحمولات: عرض فوق 3.5م، ارتفاع فوق 5م، وزن فوق 60 طن، أو مسافة أكبر من 500 كم. السيارة المرافقة بإشارات ضوئية + سائق مُدرّب. التكلفة الإضافية 800-1,500 ر.س/يوم.',
        q_en: 'When is a safety escort required?',
        a_en: 'Mandatory for loads wider than 3.5m, taller than 5m, over 60t, or beyond 500 km in distance. The escort vehicle carries warning beacons and a trained driver. Extra cost: SAR 800–1,500/day.',
      },
      {
        q_ar: 'كم مدة الحصول على تصريح نقل استثنائي؟',
        a_ar: '3-7 أيام عمل عادةً. التصاريح الطارئة بتكلفة أعلى (×2) خلال 24 ساعة. المسارات التي تمر بأكثر من منطقة تحتاج موافقة كل إمارة.',
        q_en: 'How long does it take to obtain an oversized-load permit?',
        a_en: '3–7 business days typically. Emergency permits cost double and issue within 24 hours. Routes crossing multiple regions need approval from each emirate.',
      },
    ],
  },
  {
    // Added 2026-09 in response to GSC queries "container transport
    // saoedi-arabië" (4 impressions, Dutch searchers) and the more
    // general "container transport" — no existing page was matching.
    slug:           'container-transport-saudi-arabia',
    title_ar:       'نقل الحاويات في السعودية 2026: الأسعار، الموانئ، والتراخيص',
    title_en:       'Container Transport in Saudi Arabia 2026: Prices, Ports, and Licensing',
    description_ar: 'دليل شامل لنقل الحاويات في السعودية 2026: أسعار نقل الحاويات من ميناء جدة والدمام، تراخيص TIR، اشتراطات الأمن الجمركي، ومناقصات النقل الدولي.',
    description_en: 'Complete 2026 guide to container transport in Saudi Arabia: shipping rates from Jeddah and Dammam ports, TIR licenses, customs security requirements, and cross-border tender opportunities.',
    icon:           '🚢',
    updated_at:     '2026-10-25',
    reading_minutes: 9,
    tags:           ['نقل الحاويات', 'container transport', 'موانئ السعودية', 'TIR', 'ميناء جدة', 'ميناء الدمام'],
    primary_section: 'contracts',
    tldr_ar:
      'نقل الحاويات في السعودية يتم عبر ميناء الملك عبدالعزيز (الدمام) للخليج، وميناء جدة ' +
      'الإسلامي للبحر الأحمر. مقاسات رئيسية: 20ft، 40ft، 40HC. أسعار النقل البري: حاوية 40ft ' +
      'من جدة إلى الرياض 2,800-4,000 ر.س، إلى الدمام 3,500-5,000. ترخيص TIR مطلوب للنقل العابر ' +
      'للخليج (الكويت، العراق، البحرين). متوسط مدة التسليم من الميناء إلى الوجهة الداخلية 1-3 أيام.',
    tldr_en:
      'Container transport in Saudi Arabia moves through King Abdulaziz Port (Dammam) for the ' +
      'Gulf and Jeddah Islamic Port for the Red Sea. Main sizes: 20ft, 40ft, 40HC. Trucking rates: ' +
      'a 40ft container from Jeddah to Riyadh costs SAR 2,800–4,000; to Dammam SAR 3,500–5,000. ' +
      'A TIR license is needed for cross-border transit (Kuwait, Iraq, Bahrain). Port-to-inland ' +
      'delivery time is typically 1–3 days.',
    faq: [
      {
        q_ar: 'ما أكبر ميناء حاويات في السعودية؟',
        a_ar: 'ميناء الملك عبدالعزيز في الدمام أكبر ميناء بحري في الخليج العربي (3+ مليون TEU سنوياً). ميناء جدة الإسلامي الأكبر على البحر الأحمر (5+ مليون TEU). الاختيار يعتمد على وجهة الاستيراد/التصدير.',
        q_en: 'What is the largest container port in Saudi Arabia?',
        a_en: 'King Abdulaziz Port in Dammam is the largest in the Arabian Gulf (3M+ TEU/year). Jeddah Islamic Port is the largest on the Red Sea (5M+ TEU). Choice depends on the import/export destination.',
      },
      {
        q_ar: 'كم تكلفة نقل حاوية من ميناء جدة إلى الرياض؟',
        a_ar: 'حاوية 20ft: 2,000-2,800 ر.س. حاوية 40ft: 2,800-4,000 ر.س. حاوية 40HC: 3,000-4,200 ر.س. السعر يتأثر بالوزن (فوق 20 طن +15٪)، نوع الحاوية (مبرّد +50٪)، والطقس الموسمي.',
        q_en: 'How much does it cost to transport a container from Jeddah to Riyadh?',
        a_en: 'A 20ft container: SAR 2,000–2,800. 40ft: SAR 2,800–4,000. 40HC: SAR 3,000–4,200. Rates depend on weight (over 20t adds 15%), container type (reefer +50%), and seasonal weather.',
      },
      {
        q_ar: 'ما ترخيص TIR ومتى أحتاجه؟',
        a_ar: 'ترخيص TIR (Transports Internationaux Routiers) للنقل البري الدولي عبر الحدود. يُغني عن تفتيش الجمارك في كل حدود. مطلوب للنقل بين السعودية ودول الخليج والعراق والأردن. يُصدر من الهيئة العامة للنقل بالتعاون مع IRU.',
        q_en: 'What is a TIR license and when do I need it?',
        a_en: 'TIR (Transports Internationaux Routiers) is a cross-border road transport license. It bypasses customs inspection at each border. Required for transport between Saudi Arabia and the GCC, Iraq, and Jordan. Issued by TGA in coordination with the IRU.',
      },
      {
        q_ar: 'ما الفرق بين حاوية جافة ومبرّدة؟',
        a_ar: 'جافة (Dry): للبضائع العادية. مبرّدة (Reefer): لها نظام تبريد 2-25°م تحت الصفر، تحتاج توصيلة كهرباء خاصة، وتكلفتها 50-80٪ أعلى. حاويات Open Top للحمولات المرتفعة، Flat Rack للآلات الكبيرة.',
        q_en: 'What is the difference between a dry and refrigerated container?',
        a_en: 'Dry: for standard goods. Reefer: has a 2 to -25°C cooling system, needs a dedicated power supply, and costs 50–80% more. Open Top containers are for tall loads; Flat Rack for large machinery.',
      },
      {
        q_ar: 'كيف أحصل على عقد نقل حاويات مع شركة شحن؟',
        a_ar: 'الشركات الكبرى (Maersk, MSC, CMA CGM) تعمل عبر وكلائها السعوديين. سجّل كـ Freight Forwarder أو Trucking Partner. العقود السنوية ممكنة مع ضمان حجم شهري (50+ حاوية). التسعير بنظام Spot أو عقد.',
        q_en: 'How do I secure a container-transport contract with a shipping line?',
        a_en: 'The majors (Maersk, MSC, CMA CGM) work through their Saudi agents. Register as a freight forwarder or trucking partner. Annual contracts are possible with a monthly volume guarantee (50+ containers). Pricing is either spot or contracted.',
      },
    ],
  },
  {
    slug:           'sell-fleet-business-saudi-arabia',
    title_ar:       'كيف تبيع شركة نقل أو أسطول في السعودية: دليل الـ M&A',
    title_en:       'How to Sell a Transport Company or Fleet in Saudi Arabia: M&A Guide',
    description_ar: 'دليل كامل لبيع شركة نقل أو أسطول في السعودية — التقييم، الإفصاحات، الفحص النافي للجهالة، والمراحل القانونية.',
    description_en: 'Complete guide to selling a transport company or fleet in Saudi Arabia — valuation, disclosures, due diligence, and legal stages.',
    icon:           '🤝',
    updated_at:     '2026-10-25',
    reading_minutes: 10,
    tags:           ['M&A', 'بيع شركات', 'تقييم', 'فحص نافي'],
    primary_section: 'ma',
    tldr_ar:
      'بيع شركة نقل في السعودية يمر بـ 4 مراحل: (1) التقييم — طريقة EBITDA مضاعف 4-6× ' +
      'لشركات مستقرة، (2) إعداد ملف البائع (بيانات مالية 3 سنوات، أسطول، عقود)، (3) فحص نافي ' +
      'للجهالة (4-8 أسابيع)، (4) توقيع SPA ونقل الملكية في وزارة التجارة. المدة الكلية 4-9 أشهر. ' +
      'الوسيط (M&A advisor) يأخذ 3-6٪ من قيمة الصفقة لكنه يرفع السعر النهائي 15-30٪.',
    tldr_en:
      'Selling a Saudi transport company goes through 4 stages: (1) valuation — typically EBITDA ' +
      '× 4–6 for stable businesses, (2) seller package preparation (3 years financials, fleet, ' +
      'contracts), (3) due diligence (4–8 weeks), (4) SPA signing and ownership transfer at the ' +
      'Ministry of Commerce. Total duration: 4–9 months. An M&A advisor charges 3–6% of deal ' +
      'value but typically lifts the final price by 15–30%.',
    faq: [
      {
        q_ar: 'كيف أقيّم شركة نقل قبل بيعها؟',
        a_ar: 'الطريقة الأشيع: EBITDA × مضاعف 4-6×. الشركات ذات العقود طويلة الأمد وعملاء كبار (أرامكو، سابك) تحصل على مضاعف أعلى (6-8×). التقييم المهني يُجريه محاسب قانوني أو مُقيّم معتمد من هيئة السوق المالية.',
        q_en: 'How do I value a transport company before selling?',
        a_en: 'The most common method is EBITDA × 4–6. Companies with long-term contracts and tier-1 clients (Aramco, SABIC) earn a higher multiple (6–8×). Professional valuation is done by a CPA or a CMA-licensed valuer.',
      },
      {
        q_ar: 'ما المستندات المطلوبة في الفحص النافي للجهالة؟',
        a_ar: 'بيانات مالية مُدققة لـ 3 سنوات، سجل تجاري، تراخيص TGA سارية، كشف أسطول (أعمار + استمارات)، عقود العملاء، تاريخ ضريبي من الزكاة، تاريخ عمالي من التأمينات، وعقود العمل. أي نقص يُقلّل السعر.',
        q_en: 'What documents are required during due diligence?',
        a_en: '3 years of audited financials, commercial registration, current TGA licenses, fleet disclosure (ages + istimara), customer contracts, Zakat tax history, GOSI employment history, and employment contracts. Any gap reduces the price.',
      },
      {
        q_ar: 'كم مدة بيع شركة نقل متوسطة؟',
        a_ar: '4-9 أشهر إجمالاً. التقييم وإعداد الملف 1-2 شهر، التسويق للمشترين 2-3 أشهر، الفحص النافي 4-8 أسابيع، التفاوض والعقود 1-2 شهر. الصفقات العاجلة تتم في 3 أشهر لكن بخصم 10-20٪.',
        q_en: 'How long does it take to sell a mid-sized transport company?',
        a_en: '4–9 months total. Valuation and package prep 1–2 months, buyer marketing 2–3 months, due diligence 4–8 weeks, negotiation and contracts 1–2 months. Urgent deals close in 3 months at a 10–20% discount.',
      },
      {
        q_ar: 'هل أبيع الأصول فقط (Asset Sale) أم كامل الكيان (Share Sale)؟',
        a_ar: 'بيع الأصول (شاحنات + عقود): أسهل قانونياً، لكن ضريبة أعلى. بيع الكيان (كامل الشركة بسجلها): أرخص ضريبياً، لكن المشتري يتحمّل كل الالتزامات الخفية. المشترون الكبار يفضّلون Asset Sale عادةً.',
        q_en: 'Should I sell assets only or the whole entity?',
        a_en: 'Asset sale (trucks + contracts): legally simpler, but higher tax. Share sale (entire company with its registration): lower tax, but the buyer inherits all hidden liabilities. Large buyers typically prefer asset sales.',
      },
      {
        q_ar: 'هل أحتاج محامي ومستشار M&A؟',
        a_ar: 'للصفقات فوق 5 مليون ريال: ضروري. المستشار M&A (3-6٪ من الصفقة) يرفع السعر 15-30٪ ويحمي من أخطاء كلفتها أعلى. المحامي يُراجع SPA وNDA ويحمي من بنود ما بعد البيع. التكلفة الإجمالية ~8-12٪ من الصفقة لكنها استثمار.',
        q_en: 'Do I need a lawyer and an M&A advisor?',
        a_en: 'For deals over SAR 5M: essential. An M&A advisor (3–6% fee) typically lifts the price 15–30% and prevents costly errors. The lawyer reviews the SPA and NDA and protects against post-sale clauses. Total ~8–12% of deal value, but it is an investment.',
      },
    ],
  },
]

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find(a => a.slug === slug)
}
