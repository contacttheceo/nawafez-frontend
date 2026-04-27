'use client'

import { useTranslations } from 'next-intl'

const steps = [
  { num: '1', key: 'step1' },
  { num: '2', key: 'step2' },
  { num: '3', key: 'step3' },
  { num: '4', key: 'step4' },
]

export default function HowItWorks() {
  const t = useTranslations('how')

  return (
    <section id="how" className="bg-navy py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-black text-white mb-2">{t('title')}</h2>
        <p className="text-white/60 mb-12">{t('sub')}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.key} className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald text-white
                              flex items-center justify-center text-xl font-black
                              mx-auto mb-4">
                {step.num}
              </div>
              <h4 className="text-white font-bold text-sm mb-2">
                {t(`${step.key}_title` as Parameters<typeof t>[0])}
              </h4>
              <p className="text-white/50 text-xs leading-relaxed">
                {t(`${step.key}_desc` as Parameters<typeof t>[0])}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
