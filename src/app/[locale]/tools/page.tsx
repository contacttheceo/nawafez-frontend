'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { FileText, PenLine, Sparkles, Zap, ArrowRight, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ToolsPage() {
  const locale = useLocale();
  const isRTL  = locale === 'ar';

  const tools = [
    {
      icon:        FileText,
      gradient:    'from-violet-500 to-purple-600',
      badge:       null,
      titleAr:     'محلل العقود الذكي',
      titleEn:     'AI Contract Analyzer',
      descAr:      'ارفع عقدك بصيغة PDF وسيُحلله الذكاء الاصطناعي خلال ثوانٍ — يُلخص البنود، يكشف المخاطر، ويُعطيك توصيات عملية.',
      descEn:      'Upload your PDF contract and AI will analyze it in seconds — summarizing terms, flagging risks, and giving practical recommendations.',
      href:        `/${locale}/tools/contract-analyzer`,
      cta_ar:      'افتح المحلل',
      cta_en:      'Open Analyzer',
      available:   true,
    },
    {
      icon:        PenLine,
      gradient:    'from-emerald to-teal-500',
      badge:       null,
      titleAr:     'كاتب الإعلانات الذكي',
      titleEn:     'AI Listing Writer',
      descAr:      'أدخل بيانات إعلانك ويكتب لك الذكاء الاصطناعي عنواناً ووصفاً احترافياً بالعربي والإنجليزي يجذب المشترين.',
      descEn:      'Enter your listing data and AI writes a professional bilingual title and description that attracts buyers.',
      href:        `/${locale}/listings/create`,
      cta_ar:      'أنشئ إعلاناً',
      cta_en:      'Create Listing',
      available:   true,
    },
    {
      icon:        Sparkles,
      gradient:    'from-amber-400 to-orange-500',
      badge:       isRTL ? 'قريباً' : 'Coming Soon',
      titleAr:     'مستشار التسعير',
      titleEn:     'Pricing Advisor',
      descAr:      'يُحلل أسعار إعلانات مشابهة ويقترح النطاق السعري الأمثل لإعلانك بناءً على السوق الحالي.',
      descEn:      'Analyzes comparable listings and suggests the optimal price range for your listing based on current market data.',
      href:        null,
      cta_ar:      'قريباً',
      cta_en:      'Coming Soon',
      available:   false,
    },
    {
      icon:        Zap,
      gradient:    'from-blue-500 to-indigo-600',
      badge:       isRTL ? 'قريباً' : 'Coming Soon',
      titleAr:     'مترجم المراسلات',
      titleEn:     'Message Translator',
      descAr:      'يُترجم رسائلك التجارية بين العربية والإنجليزية بأسلوب B2B احترافي يناسب قطاع اللوجستيك.',
      descEn:      'Translates your business messages between Arabic and English in a professional B2B style for the logistics sector.',
      href:        null,
      cta_ar:      'قريباً',
      cta_en:      'Coming Soon',
      available:   false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-navy via-navy/95 to-navy/80 text-white">
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20
                          rounded-full px-4 py-1.5 text-sm font-medium text-white/80 mb-5">
            <Sparkles size={14} className="text-violet-300" />
            {isRTL ? 'أدوات الذكاء الاصطناعي' : 'AI-Powered Tools'}
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-4">
            {isRTL
              ? 'أدوات تُحوّل طريقة عملك في اللوجستيك'
              : 'Tools That Transform How You Work in Logistics'}
          </h1>
          <p className="text-white/60 text-base max-w-2xl mx-auto">
            {isRTL
              ? 'نوافذ تُدمج الذكاء الاصطناعي في كل خطوة من خطوات عملك — من تحليل العقود إلى كتابة الإعلانات.'
              : 'Nwafiz integrates AI into every step of your workflow — from contract analysis to listing creation.'}
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const title = isRTL ? tool.titleAr : tool.titleEn;
            const desc  = isRTL ? tool.descAr  : tool.descEn;
            const cta   = isRTL ? tool.cta_ar  : tool.cta_en;

            const Card = (
              <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm
                               flex flex-col gap-4 h-full
                               ${tool.available ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : 'opacity-70'}`}>
                {/* Icon + Badge */}
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient}
                                   flex items-center justify-center shadow-sm`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  {tool.badge && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1
                                     bg-amber-50 text-amber-600 rounded-full border border-amber-200">
                      <Clock size={10} />
                      {tool.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h2 className="font-black text-navy text-lg mb-2">{title}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>

                {/* CTA */}
                <div className={`flex items-center gap-2 text-sm font-bold
                                 ${tool.available ? 'text-emerald' : 'text-gray-400'}`}>
                  {cta}
                  {tool.available && (
                    <ArrowRight size={15} className={isRTL ? 'rotate-180' : ''} />
                  )}
                </div>
              </div>
            );

            return tool.available && tool.href ? (
              <Link key={tool.titleEn} href={tool.href} className="block h-full">
                {Card}
              </Link>
            ) : (
              <div key={tool.titleEn} className="h-full">{Card}</div>
            );
          })}
        </div>

        {/* Coming Soon Note */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400">
            {isRTL
              ? 'نعمل باستمرار على إضافة أدوات جديدة — تابع المنصة لأحدث المستجدات'
              : "We're continuously adding new tools — stay tuned for the latest updates"}
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
