/**
 * City landing pages registry.
 *
 * Each city gets its own SEO-tuned page at /[locale]/cities/[slug] that
 * targets local-intent searches like "شاحنات الرياض" or "إيجار شاحنة جدة".
 * These pages rank for highly commercial keywords because they combine:
 *  - Geo modifier (city name)
 *  - Service intent (شاحنات، نقل، عقود)
 *  - Real listings filtered for that city
 */

export interface City {
  slug: string
  name_ar: string
  name_en: string
  region_ar: string
  region_en: string
  population_label_ar: string
  population_label_en: string
  /** Notable economic features that affect logistics demand */
  features_ar: string[]
  features_en: string[]
  /** Real Arabic-spelled city name used as a filter on /listings?city=… */
  listings_filter_value: string
  /** Lat/lng — used in Place schema */
  lat: number
  lng: number
  icon: string
}

export const CITIES: City[] = [
  {
    slug:        'riyadh',
    name_ar:     'الرياض',
    name_en:     'Riyadh',
    region_ar:   'منطقة الرياض',
    region_en:   'Riyadh Region',
    population_label_ar: '7.6 مليون نسمة',
    population_label_en: '7.6M population',
    features_ar: [
      'العاصمة الإدارية والمركز اللوجستي الأول',
      'موطن أكبر مشاريع رؤية 2030 (نيوم، القدية، الدرعية)',
      'مركز توزيع رئيسي لبضائع المنطقة الوسطى',
      'تستضيف ميناء الرياض الجاف',
    ],
    features_en: [
      'Capital and #1 logistics hub',
      'Home to Vision 2030 megaprojects (NEOM, Qiddiya, Diriyah)',
      'Central distribution hub for the Central Region',
      'Houses Riyadh Dry Port',
    ],
    listings_filter_value: 'الرياض',
    lat: 24.7136, lng: 46.6753,
    icon: '🏙️',
  },
  {
    slug:        'jeddah',
    name_ar:     'جدة',
    name_en:     'Jeddah',
    region_ar:   'منطقة مكة المكرمة',
    region_en:   'Makkah Region',
    population_label_ar: '4.7 مليون نسمة',
    population_label_en: '4.7M population',
    features_ar: [
      'العاصمة الاقتصادية والبوابة البحرية الكبرى',
      'تستضيف ميناء جدة الإسلامي — أكبر موانئ البحر الأحمر',
      'مدخل رئيسي للحجاج والعمرة (مطار الملك عبدالعزيز)',
      'مركز التجارة مع أفريقيا وأوروبا',
    ],
    features_en: [
      'Commercial capital and major seaport gateway',
      'Houses Jeddah Islamic Port — largest Red Sea port',
      'Main entry for Hajj and Umrah pilgrims',
      'Trade hub for Africa and Europe',
    ],
    listings_filter_value: 'جدة',
    lat: 21.5433, lng: 39.1728,
    icon: '🏖️',
  },
  {
    slug:        'dammam',
    name_ar:     'الدمام',
    name_en:     'Dammam',
    region_ar:   'المنطقة الشرقية',
    region_en:   'Eastern Province',
    population_label_ar: '1.4 مليون نسمة',
    population_label_en: '1.4M population',
    features_ar: [
      'مركز قطاع النفط والصناعات البتروكيماوية',
      'موطن ميناء الملك عبدالعزيز — ثاني أكبر ميناء بحري',
      'مدخل بري لجسر الملك فهد والبحرين',
      'مركز لوجستي لشركة أرامكو السعودية',
    ],
    features_en: [
      'Oil and petrochemical industry hub',
      'Houses King Abdulaziz Port — 2nd largest seaport',
      'Land gateway to Bahrain via King Fahd Causeway',
      'Saudi Aramco logistics hub',
    ],
    listings_filter_value: 'الدمام',
    lat: 26.4207, lng: 50.0888,
    icon: '⛽',
  },
  {
    slug:        'mecca',
    name_ar:     'مكة المكرمة',
    name_en:     'Mecca',
    region_ar:   'منطقة مكة المكرمة',
    region_en:   'Makkah Region',
    population_label_ar: '2.1 مليون نسمة + ملايين الحجاج',
    population_label_en: '2.1M residents + millions of pilgrims',
    features_ar: [
      'وجهة موسمية ضخمة لخدمات النقل والتموين',
      'سوق نشط لتأجير الحافلات والشاحنات قصيرة الأمد',
      'متطلبات تشغيلية خاصة في موسم الحج والعمرة',
      'مركز رئيسي لتوزيع البضائع لمحافظات الطائف وجدة',
    ],
    features_en: [
      'Massive seasonal demand for transport and supply',
      'Active bus and truck short-term rental market',
      'Special operations during Hajj and Umrah seasons',
      'Distribution hub for Taif and Jeddah surroundings',
    ],
    listings_filter_value: 'مكة المكرمة',
    lat: 21.3891, lng: 39.8579,
    icon: '🕋',
  },
  {
    slug:        'medina',
    name_ar:     'المدينة المنورة',
    name_en:     'Medina',
    region_ar:   'منطقة المدينة المنورة',
    region_en:   'Madinah Region',
    population_label_ar: '1.5 مليون نسمة',
    population_label_en: '1.5M population',
    features_ar: [
      'وجهة سياحة دينية على مدار السنة',
      'سوق تأجير حافلات نشط مع موسمية ربيع/خريف',
      'يربط مع جدة والقصيم عبر الخطوط السريعة',
      'منطقة زراعية (التمور) ذات نقل مبرّد متخصص',
    ],
    features_en: [
      'Year-round religious tourism destination',
      'Active bus rental market with seasonal peaks',
      'Highway links to Jeddah and Qassim',
      'Agricultural region (dates) with specialized refrigerated transport',
    ],
    listings_filter_value: 'المدينة المنورة',
    lat: 24.5247, lng: 39.5692,
    icon: '🌴',
  },
]

export function getCity(slug: string): City | undefined {
  return CITIES.find(c => c.slug === slug)
}
