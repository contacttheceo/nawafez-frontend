'use client'

import { useTranslations } from 'next-intl'
import { UserPlus, FileText, Users, CheckCircle, LucideIcon } from 'lucide-react'

const steps: { Icon: LucideIcon; key: string }[] = [
  { Icon: UserPlus,    key: 'step1' },
  { Icon: FileText,    key: 'step2' },
  { Icon: Users,       key: 'step3' },
  { Icon: CheckCircle, key: 'step4' },
]

export default function HowItWorks() {
  const t = useTranslations('how')

  return (
    <section id="how" className="bg-navy py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-black text-white mb-2">{t('title')}</h2>
        <p className="text-white/60 mb-12">{t('sub')}</p>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Connecting line — desktop only */}
          <div className="absolute top-7 start-[12%] end-[12%] h-px bg-emerald/30 hidden md:block" />

          {steps.map(({ Icon, key }, idx) => (
            <div key={key} className="text-center relative z-10">
              {/* Icon with numbered badge */}
              <div className="relative w-fit mx-auto mb-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald/20 border border-emerald/30
                                flex items-center justify-center">
                  <Icon size={24} className="text-emerald-light" />
                </div>
                <span className="absolute -top-2 -end-2 w-5 h-5 bg-emerald rounded-full
                                 text-[10px] text-white font-black flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>

              <h4 className="text-white font-bold text-sm mb-2">
                {t(`${key}_title` as Parameters<typeof t>[0])}
              </h4>
              <p className="text-white/50 text-xs leading-relaxed">
                {t(`${key}_desc` as Parameters<typeof t>[0])}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
