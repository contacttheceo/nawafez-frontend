'use client'

import { useLocale } from 'next-intl'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { faqs } from '@/data/faq'

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-start gap-4 hover:text-emerald transition-colors"
      >
        <span className="font-semibold text-sm text-navy">{q}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function FaqPage() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'
  const items  = isRTL ? faqs.ar : faqs.en

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-black text-navy mb-2">
          {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {isRTL ? 'إجابات على أكثر الأسئلة شيوعاً' : 'Answers to the most common questions'}
        </p>

        <div className="card p-6">
          {items.map((item, i) => (
            <FaqItem key={i} {...item} />
          ))}
        </div>

        <div className="mt-8 card p-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            {isRTL ? 'لم تجد إجابة؟ تواصل معنا مباشرةً' : "Didn't find an answer? Contact us directly"}
          </p>
          <a
            href="mailto:support@nwafizlogi.com"
            className="btn-primary text-sm px-6 py-2"
          >
            support@nwafizlogi.com
          </a>
        </div>

        <div className="mt-6 text-center">
          <Link href={`/${locale}/listings`} className="text-sm text-emerald hover:underline">
            {isRTL ? '← العودة للإعلانات' : 'Back to Listings →'}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
