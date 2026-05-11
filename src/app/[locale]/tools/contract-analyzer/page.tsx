'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Zap, Upload, FileText, X, AlertTriangle,
  Check, Info, ChevronLeft, ChevronRight, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface ContractRisk {
  level: 'high' | 'medium' | 'low';
  description: string;
}

interface ContractAnalysisResult {
  summary?: string;
  contract_type?: string;
  duration?: string;
  value?: string;
  payment_terms?: string;
  key_terms?: string[];
  risks?: ContractRisk[];
  penalties?: string;
  termination_clauses?: string;
  recommendations?: string[];
  overall_risk?: 'low' | 'medium' | 'high';
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function ContractAnalyzerPage() {
  const locale = useLocale();
  const isRTL  = locale === 'ar';

  const [contractFile,     setContractFile]     = useState<File | null>(null);
  const [analyzing,        setAnalyzing]        = useState(false);
  const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!contractFile) return;
    setAnalyzing(true);
    setContractAnalysis(null);
    try {
      const fd = new FormData();
      fd.append('contract', contractFile);
      const res  = await fetch('/api/ai/analyze-contract', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'فشل التحليل');
      setContractAnalysis(json.data);
      toast.success(isRTL ? '✅ تم تحليل العقد بنجاح' : '✅ Contract analyzed successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { setContractFile(null); setContractAnalysis(null); };

  const riskColor = {
    high:   'bg-red-50 border-red-100 text-red-600',
    medium: 'bg-amber-50 border-amber-100 text-amber-600',
    low:    'bg-emerald-50 border-emerald-100 text-emerald-700',
  };
  const riskIcon = {
    high:   'text-red-500',
    medium: 'text-amber-500',
    low:    'text-gray-400',
  };

  const BackArrow = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">

        {/* Breadcrumb */}
        <Link
          href={`/${locale}/listings?section=contracts`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy mb-6 transition-colors"
        >
          <BackArrow size={15} />
          {isRTL ? 'العقود' : 'Contracts'}
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl
                          shadow-purple-200 mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-navy mb-2">
            {isRTL ? 'محلل العقود بالذكاء الاصطناعي' : 'AI Contract Analyzer'}
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            {isRTL
              ? 'ارفع أي عقد PDF قبل التوقيع واحصل على تحليل فوري للمخاطر والبنود الرئيسية والتوصيات'
              : 'Upload any PDF contract before signing and get instant analysis of risks, key terms, and recommendations'}
          </p>

          {/* How it works */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
            {[
              { icon: '📄', text: isRTL ? 'ارفع الـ PDF' : 'Upload PDF' },
              { icon: '🤖', text: isRTL ? 'يحلله الذكاء الاصطناعي' : 'AI analyzes it' },
              { icon: '✅', text: isRTL ? 'احصل على التقرير' : 'Get the report' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span>{step.icon}</span>
                <span>{step.text}</span>
                {i < 2 && <span className={`${isRTL ? 'mr-4' : 'ml-4'} text-gray-200`}>←</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Upload card */}
        {!contractAnalysis && (
          <div className="card p-6 space-y-4">
            <label
              className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed
                          rounded-2xl py-14 px-6 cursor-pointer transition-all duration-200
                          ${contractFile
                            ? 'border-violet-400 bg-violet-50'
                            : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/40'
                          }`}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) setContractFile(f);
                }}
              />
              {contractFile ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                    <FileText size={28} className="text-violet-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-violet-700">{contractFile.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {(contractFile.size / 1024).toFixed(0)} KB
                      {' · '}
                      {isRTL ? 'انقر للتغيير' : 'Click to change'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Upload size={28} className="text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-600">
                      {isRTL ? 'اسحب ملف PDF هنا أو انقر للاختيار' : 'Drag a PDF here or click to select'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {isRTL ? 'الحد الأقصى 10 ميجابايت' : 'Max file size: 10 MB'}
                    </p>
                  </div>
                </>
              )}
            </label>

            {contractFile && (
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5
                             bg-gradient-to-r from-violet-500 to-purple-600
                             text-white font-bold rounded-xl hover:opacity-90
                             transition disabled:opacity-60 shadow-lg shadow-purple-200 text-sm"
                >
                  {analyzing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isRTL ? 'جارٍ تحليل العقد…' : 'Analyzing contract…'}
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      {isRTL ? 'تحليل العقد بالذكاء الاصطناعي' : 'Analyze with AI'}
                    </>
                  )}
                </button>
                <button
                  onClick={reset}
                  className="px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
                  title={isRTL ? 'إزالة الملف' : 'Remove file'}
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            )}

            {/* Privacy note */}
            <div className="flex items-center gap-2 justify-center text-xs text-gray-300">
              <Shield size={12} />
              {isRTL
                ? 'ملفك لا يُحفظ — يُحلَّل مباشرةً ويُحذف فور الانتهاء'
                : 'Your file is not stored — analyzed in real-time and immediately discarded'}
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {contractAnalysis && (
          <div className="space-y-4">

            {/* Summary */}
            <div className="card p-5 border-s-4 border-s-violet-400">
              <p className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-2">
                {isRTL ? '📋 ملخص العقد' : '📋 Contract Summary'}
              </p>
              <p className="text-gray-700 leading-relaxed">{contractAnalysis.summary}</p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {contractAnalysis.contract_type && (
                <div className="card px-4 py-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    {isRTL ? 'نوع العقد' : 'Contract Type'}
                  </p>
                  <p className="text-sm font-bold text-navy">{contractAnalysis.contract_type}</p>
                </div>
              )}
              {contractAnalysis.duration && (
                <div className="card px-4 py-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    {isRTL ? 'المدة' : 'Duration'}
                  </p>
                  <p className="text-sm font-bold text-navy">{contractAnalysis.duration}</p>
                </div>
              )}
              {contractAnalysis.value && (
                <div className="card px-4 py-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    {isRTL ? 'القيمة' : 'Value'}
                  </p>
                  <p className="text-sm font-bold text-emerald">{contractAnalysis.value}</p>
                </div>
              )}
              {contractAnalysis.payment_terms && (
                <div className="card px-4 py-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    {isRTL ? 'شروط الدفع' : 'Payment'}
                  </p>
                  <p className="text-sm font-bold text-navy">{contractAnalysis.payment_terms}</p>
                </div>
              )}
            </div>

            {/* Overall risk */}
            {contractAnalysis.overall_risk && (
              <div className={`card flex items-center gap-3 px-5 py-4 border ${riskColor[contractAnalysis.overall_risk]}`}>
                <AlertTriangle size={20} />
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold opacity-70">
                    {isRTL ? 'مستوى المخاطرة الكلي' : 'Overall Risk Level'}
                  </p>
                  <p className="font-black text-base">
                    {contractAnalysis.overall_risk === 'high'
                      ? (isRTL ? 'عالٍ ⚠️ — يُنصح بمراجعة قانونية' : 'High ⚠️ — Legal review recommended')
                      : contractAnalysis.overall_risk === 'medium'
                      ? (isRTL ? 'متوسط — راجع البنود المحددة' : 'Medium — Review specific clauses')
                      : (isRTL ? 'منخفض ✓ — العقد معقول' : 'Low ✓ — Contract looks reasonable')}
                  </p>
                </div>
              </div>
            )}

            {/* Risks */}
            {contractAnalysis.risks && contractAnalysis.risks.length > 0 && (
              <div className="card p-5">
                <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-500" />
                  {isRTL ? 'المخاطر المحتملة' : 'Potential Risks'}
                </p>
                <div className="space-y-2">
                  {contractAnalysis.risks.map((risk, i) => (
                    <div key={i} className={`flex gap-3 p-3 rounded-xl border ${
                      risk.level === 'high'   ? 'bg-red-50 border-red-100' :
                      risk.level === 'medium' ? 'bg-amber-50 border-amber-100' :
                                                'bg-gray-50 border-gray-100'
                    }`}>
                      <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${riskIcon[risk.level]}`} />
                      <p className="text-sm text-gray-700">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key terms */}
            {contractAnalysis.key_terms && contractAnalysis.key_terms.length > 0 && (
              <div className="card p-5">
                <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Check size={15} className="text-emerald" />
                  {isRTL ? 'البنود الرئيسية' : 'Key Terms'}
                </p>
                <ul className="space-y-2">
                  {contractAnalysis.key_terms.map((term, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                      <Check size={14} className="text-emerald shrink-0 mt-0.5" />
                      {term}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Termination + Penalties */}
            {(contractAnalysis.termination_clauses || contractAnalysis.penalties) && (
              <div className="card p-5 bg-orange-50 border border-orange-100">
                {contractAnalysis.termination_clauses && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1.5">
                      {isRTL ? '⚠️ شروط الإنهاء المبكر' : '⚠️ Termination Clauses'}
                    </p>
                    <p className="text-sm text-gray-700">{contractAnalysis.termination_clauses}</p>
                  </div>
                )}
                {contractAnalysis.penalties && (
                  <div>
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1.5">
                      {isRTL ? '💰 الغرامات' : '💰 Penalties'}
                    </p>
                    <p className="text-sm text-gray-700">{contractAnalysis.penalties}</p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {contractAnalysis.recommendations && contractAnalysis.recommendations.length > 0 && (
              <div className="card p-5 bg-blue-50 border border-blue-100">
                <p className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
                  <Info size={15} />
                  {isRTL ? 'توصيات قبل التوقيع' : 'Recommendations Before Signing'}
                </p>
                <ol className="space-y-2">
                  {contractAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-blue-800">
                      <span className="font-black text-blue-400 shrink-0">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={reset}
                className="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-xl
                           text-sm text-gray-400 hover:border-violet-300 hover:text-violet-600 transition"
              >
                {isRTL ? '↑ تحليل عقد آخر' : '↑ Analyze another contract'}
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-xs text-gray-300 pb-4">
              {isRTL
                ? 'هذا التحليل استرشادي فقط ولا يُغني عن استشارة محامٍ متخصص.'
                : 'This analysis is for informational purposes only and does not replace professional legal advice.'}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
