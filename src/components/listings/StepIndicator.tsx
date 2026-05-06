'use client';

import { Check } from 'lucide-react';

interface Step {
  labelAr: string;
  labelEn: string;
  emoji: string;
}

const STEPS: Step[] = [
  { labelAr: 'القسم',     labelEn: 'Section',   emoji: '📂' },
  { labelAr: 'التفاصيل', labelEn: 'Details',   emoji: '📝' },
  { labelAr: 'الموقع',   labelEn: 'Location',  emoji: '📍' },
  { labelAr: 'الصور',    labelEn: 'Images',    emoji: '🖼️' },
  { labelAr: 'المراجعة', labelEn: 'Review',    emoji: '✅' },
];

interface Props {
  current: number; // 1-based
  isRTL: boolean;
}

export default function StepIndicator({ current, isRTL }: Props) {
  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute top-5 start-0 end-0 h-0.5 bg-gray-200 -z-0">
          <div
            className="h-full bg-emerald transition-all duration-500"
            style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const stepNum  = idx + 1;
          const isDone   = stepNum < current;
          const isActive = stepNum === current;

          return (
            <div key={stepNum} className="flex flex-col items-center gap-1.5 z-10">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                            border-2 transition-all duration-300
                            ${isDone   ? 'bg-emerald border-emerald text-white'                 : ''}
                            ${isActive ? 'bg-white border-emerald text-emerald shadow-md scale-110' : ''}
                            ${!isDone && !isActive ? 'bg-white border-gray-200 text-gray-400'  : ''}`}
              >
                {isDone ? <Check size={16} /> : <span>{step.emoji}</span>}
              </div>

              {/* Label — hide on very small screens */}
              <span
                className={`text-[10px] font-semibold hidden sm:block transition-colors
                            ${isActive ? 'text-emerald' : isDone ? 'text-gray-600' : 'text-gray-300'}`}
              >
                {isRTL ? step.labelAr : step.labelEn}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step text */}
      <p className="text-center text-xs text-gray-400 mt-4">
        {isRTL
          ? `الخطوة ${current} من ${STEPS.length}`
          : `Step ${current} of ${STEPS.length}`}
      </p>
    </div>
  );
}
