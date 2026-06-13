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
    updated_at:     '2026-06-09',
    reading_minutes: 9,
    tags:           ['تراخيص', 'TGA', 'الهيئة العامة للنقل', 'نقل البضائع'],
    primary_section: 'ma',
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
    updated_at:     '2026-06-09',
    reading_minutes: 6,
    tags:           ['سائقون', 'تراخيص قيادة', 'فئة خامسة', 'HAZMAT'],
    primary_section: 'jobs',
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
    title_ar:       'لوجستيك الميل الأخير في السعودية: تحديات وفرص نمو 30%',
    title_en:       'Last-Mile Delivery in Saudi Arabia: Challenges and 30% Growth Opportunities',
    description_ar: 'تحليل سوق توصيل الميل الأخير في السعودية — حجم السوق، اللاعبون الرئيسيون، التحديات، وفرص للناقلين الصغار.',
    description_en: 'Analysis of the Saudi last-mile delivery market — size, key players, challenges, and opportunities for small carriers.',
    icon:           '📦',
    updated_at:     '2026-06-09',
    reading_minutes: 8,
    tags:           ['الميل الأخير', 'E-commerce', 'توصيل', 'فرص نمو'],
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
