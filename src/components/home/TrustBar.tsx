'use client'

import { useLocale } from 'next-intl'

export default function TrustBar() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'

  const items = isRTL
    ? [
        { icon: '🇸🇦', title: 'سعودي ١٠٠%',    sub: 'مرخص ومتوافق مع الأنظمة' },
        { icon: '🔒',   title: 'شركات موثّقة',  sub: 'عملية تحقق صارمة'         },
        { icon: '⚡',   title: 'نشر فوري',      sub: 'إعلانك يظهر خلال دقائق'  },
        { icon: '🤝',   title: '+٩٥M ر.س',     sub: 'حجم صفقات مكتملة'         },
      ]
    : [
        { icon: '🇸🇦', title: '100% Saudi',          sub: 'Licensed & compliant'         },
        { icon: '🔒',   title: 'Verified Businesses',  sub: 'Strict verification process'  },
        { icon: '⚡',   title: 'Instant Publishing',   sub: 'Your listing goes live fast'  },
        { icon: '🤝',   title: '+95M SAR',             sub: 'In completed deals'           },
      ]

  return (
    <section className="bg-white border-b border-gray-100 py-5 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="font-black text-navy text-sm leading-tight">{item.title}</div>
                <div className="text-gray-400 text-xs mt-0.5">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
