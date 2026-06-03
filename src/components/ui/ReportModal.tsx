'use client';

import { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';

const REASONS = [
  { value: 'fraud',        labelAr: '🚨 احتيال أو نصب',       labelEn: '🚨 Fraud or Scam'       },
  { value: 'misleading',   labelAr: '❌ معلومات مضللة',        labelEn: '❌ Misleading Info'      },
  { value: 'duplicate',    labelAr: '🔁 إعلان مكرر',           labelEn: '🔁 Duplicate Listing'   },
  { value: 'inappropriate',labelAr: '🔞 محتوى غير لائق',       labelEn: '🔞 Inappropriate Content'},
  { value: 'spam',         labelAr: '📢 إزعاج أو سبام',        labelEn: '📢 Spam'                },
  { value: 'other',        labelAr: '💬 سبب آخر',              labelEn: '💬 Other'               },
];

interface Props {
  isRTL:     boolean;
  onClose:   () => void;
  onSubmit:  (reason: string, details: string) => Promise<void>;
}

export default function ReportModal({ isRTL, onClose, onSubmit }: Props) {
  const [reason,      setReason]      = useState('');
  const [details,     setDetails]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    await onSubmit(reason, details);
    setSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2 text-red-500">
            <Flag size={18} />
            <h2 id="report-modal-title" className="font-bold text-gray-900 text-base">
              {isRTL ? 'الإبلاغ عن الإعلان' : 'Report Listing'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              {isRTL
                ? 'سيتم مراجعة بلاغك من فريق نوافذ. يُرجى التأكد من صحة السبب.'
                : 'Your report will be reviewed by the Nwafiz team. Please ensure accuracy.'}
            </p>
          </div>

          {/* Reasons */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              {isRTL ? 'سبب الإبلاغ *' : 'Reason *'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition
                              ${reason === r.value
                                ? 'border-red-400 bg-red-50 text-red-700'
                                : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-red-500"
                  />
                  {isRTL ? r.labelAr : r.labelEn}
                </label>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              {isRTL ? 'تفاصيل إضافية (اختياري)' : 'Additional Details (optional)'}
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="input text-sm min-h-[80px] resize-none"
              dir={isRTL ? 'rtl' : 'ltr'}
              placeholder={isRTL ? 'أضف أي تفاصيل تساعد في مراجعة البلاغ…' : 'Add any details that help review the report…'}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!reason || submitting}
              className="flex-1 text-sm py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600
                         text-white font-semibold transition disabled:opacity-40"
            >
              {submitting
                ? (isRTL ? 'جارٍ الإرسال…' : 'Submitting…')
                : (isRTL ? '🚩 إرسال البلاغ' : '🚩 Submit Report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
