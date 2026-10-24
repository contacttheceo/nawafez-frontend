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
    updated_at:     '2026-06-09',
    reading_minutes: 7,
    tags:           ['شاحنات', 'بيع شاحنات', 'السعودية', 'دليل'],
    primary_section: 'fleet',
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
    updated_at:     '2026-06-09',
    reading_minutes: 6,
    tags:           ['أسعار', 'إيجار شاحنات', 'تكاليف', 'السعودية'],
    primary_section: 'fleet',
  },
  {
    slug:           'choose-trusted-transport-contractor',
    title_ar:       'كيف تختار مزوّد عقد نقل موثوق في السعودية',
    title_en:       'How to Choose a Trusted Transport Contractor in Saudi Arabia',
    description_ar: 'معايير اختيار مزوّد خدمات النقل: التراخيص، التأمين، الأسطول، المراجعات، الشروط التعاقدية — وكيف تتجنّب الاحتيال.',
    description_en: 'Criteria for choosing a transport service provider: licenses, insurance, fleet, reviews, contract terms — and how to avoid scams.',
    icon:           '🤝',
    updated_at:     '2026-06-09',
    reading_minutes: 8,
    tags:           ['عقود نقل', 'موثوقية', 'تأمين', 'دليل'],
    primary_section: 'contracts',
  },
  {
    slug:           'fixed-vs-spot-transport-contracts',
    title_ar:       'الفرق بين عقد النقل الثابت وعقد Spot: أيهما يناسبك؟',
    title_en:       'Fixed vs Spot Transport Contracts: Which Suits You?',
    description_ar: 'شرح مفصّل للفرق بين العقد الثابت طويل الأمد وعقد spot الفوري — التكاليف، المرونة، المخاطر، ومتى تستخدم كل نوع.',
    description_en: 'Detailed comparison of long-term fixed contracts vs. spot contracts — costs, flexibility, risks, and when to use each.',
    icon:           '⚖️',
    updated_at:     '2026-06-09',
    reading_minutes: 7,
    tags:           ['عقود', 'spot', 'تخطيط لوجستي', 'تكاليف'],
    primary_section: 'contracts',
  },
  {
    slug:           'fleet-financing-saudi-arabia',
    title_ar:       'دليل تمويل الأساطيل في السعودية: البنوك، الإيجار التمويلي، والصكوك',
    title_en:       'Fleet Financing in Saudi Arabia: Banks, Leasing, and Sukuk',
    description_ar: 'مقارنة شاملة بين خيارات تمويل الأساطيل اللوجستية في السعودية: قروض البنوك، الإيجار التمويلي، الصكوك، ومنتجات SIDF.',
    description_en: 'Complete comparison of logistics fleet financing options in Saudi Arabia: bank loans, lease-to-own, sukuk, and SIDF programs.',
    icon:           '🏦',
    updated_at:     '2026-06-09',
    reading_minutes: 9,
    tags:           ['تمويل', 'بنوك', 'صكوك', 'أساطيل', 'SIDF'],
    primary_section: 'ma',
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
    updated_at:     '2026-06-09',
    reading_minutes: 8,
    tags:           ['سلسلة التبريد', 'نقل مبرّد', 'SFDA', 'أدوية', 'أغذية'],
    primary_section: 'fleet',
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
    updated_at:     '2026-09-28',
    reading_minutes: 8,
    tags:           ['الميل الأخير', 'on-demand delivery', 'E-commerce', 'توصيل', 'saudi arabia'],
    primary_section: 'contracts',
  },
  {
    slug:           'hazmat-transport-license-saudi-arabia',
    title_ar:       'ترخيص نقل المواد الخطرة (HAZMAT) في السعودية 2026: الاشتراطات والأسعار',
    title_en:       'HAZMAT Transport License in Saudi Arabia 2026: Requirements and Pricing',
    description_ar: 'دليل كامل لترخيص نقل المواد الخطرة في السعودية 2026: اشتراطات ADR، تدريب السائقين، التأمين بحد 5 مليون ريال، رواتب سائقي HAZMAT، وعقود أرامكو وسابك.',
    description_en: 'Complete 2026 guide to HAZMAT transport licensing in Saudi Arabia: ADR requirements, driver training, SAR 5M insurance coverage, HAZMAT driver salaries, and Aramco/SABIC contracts.',
    icon:           '☢️',
    updated_at:     '2026-09-28',
    reading_minutes: 8,
    tags:           ['HAZMAT', 'نقل مواد خطرة', 'ADR', 'أرامكو', 'تراخيص السعودية'],
    primary_section: 'fleet',
  },
  {
    slug:           'air-cargo-shipping-saudi-arabia',
    title_ar:       'الشحن الجوي من السعودية 2026: الأسعار، المطارات، والمستندات',
    title_en:       'Air Cargo Shipping from Saudi Arabia 2026: Rates, Airports, Documentation',
    description_ar: 'دليل شامل للشحن الجوي من السعودية 2026: أسعار الشحن من مطارات الرياض وجدة والدمام لكل الوجهات الرئيسية، مستندات AWB والجمارك، والشحن المبرّد جواً.',
    description_en: 'Complete 2026 air cargo guide from Saudi Arabia: shipping rates from Riyadh, Jeddah, and Dammam airports to all major destinations, AWB and customs documentation, and cold-chain air freight.',
    icon:           '✈️',
    updated_at:     '2026-09-28',
    reading_minutes: 9,
    tags:           ['شحن جوي', 'air cargo', 'مطار الملك خالد', 'AWB', 'saudi airports'],
    primary_section: 'contracts',
  },
  {
    slug:           'warehouse-rental-riyadh',
    title_ar:       'إيجار المستودعات في الرياض 2026: الأسعار، المناطق، والأنواع',
    title_en:       'Warehouse Rental in Riyadh 2026: Prices, Districts, and Types',
    description_ar: 'دليل شامل لإيجار المستودعات اللوجستية في الرياض 2026: أسعار المتر المربع في السلي، سلبوخ، طريق الخرج. مستودعات جافة، مبردة، وجمركية.',
    description_en: 'Complete 2026 guide to logistics warehouse rental in Riyadh: SAR per sqm in Sulai, Salboukh, Kharj Road. Dry, cold-storage, and bonded warehouses.',
    icon:           '🏭',
    updated_at:     '2026-09-28',
    reading_minutes: 8,
    tags:           ['مستودعات الرياض', 'warehouse rental', 'السلي', 'سلبوخ', 'مستودعات جمركية'],
    primary_section: 'contracts',
  },
  {
    slug:           'heavy-equipment-transport-saudi-arabia',
    title_ar:       'نقل المعدات الثقيلة في السعودية 2026: التصاريح، الأسعار، والتخطيط',
    title_en:       'Heavy Equipment Transport in Saudi Arabia 2026: Permits, Prices, Route Planning',
    description_ar: 'دليل نقل المعدات الثقيلة والحفارات والكرينات في السعودية 2026: تصاريح النقل الاستثنائي، أسعار نقل البلدوزر والحفارة، تخطيط المسارات، والتأمين المطلوب.',
    description_en: 'Guide to heavy equipment transport in Saudi Arabia 2026: oversized load permits, bulldozer and excavator transport pricing, route planning, and required insurance coverage.',
    icon:           '🏗️',
    updated_at:     '2026-09-28',
    reading_minutes: 8,
    tags:           ['نقل معدات ثقيلة', 'heavy equipment', 'تصاريح نقل استثنائي', 'كرينات', 'حفارات'],
    primary_section: 'fleet',
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
    updated_at:     '2026-09-28',
    reading_minutes: 9,
    tags:           ['نقل الحاويات', 'container transport', 'موانئ السعودية', 'TIR', 'ميناء جدة', 'ميناء الدمام'],
    primary_section: 'contracts',
  },
  {
    slug:           'sell-fleet-business-saudi-arabia',
    title_ar:       'كيف تبيع شركة نقل أو أسطول في السعودية: دليل الـ M&A',
    title_en:       'How to Sell a Transport Company or Fleet in Saudi Arabia: M&A Guide',
    description_ar: 'دليل كامل لبيع شركة نقل أو أسطول في السعودية — التقييم، الإفصاحات، الفحص النافي للجهالة، والمراحل القانونية.',
    description_en: 'Complete guide to selling a transport company or fleet in Saudi Arabia — valuation, disclosures, due diligence, and legal stages.',
    icon:           '🤝',
    updated_at:     '2026-06-09',
    reading_minutes: 10,
    tags:           ['M&A', 'بيع شركات', 'تقييم', 'فحص نافي'],
    primary_section: 'ma',
  },
]

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find(a => a.slug === slug)
}
