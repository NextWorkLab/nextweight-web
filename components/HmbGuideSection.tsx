// /components/HmbGuideSection.tsx
"use client";

import { HMB_GUIDE_CONTENT } from '../lib/content';

export default function HmbGuideSection() {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🛡️</span>
        <h3 className="text-xl font-black text-gray-900">{HMB_GUIDE_CONTENT.title}</h3>
      </div>
      
      <p className="text-gray-600 mb-6 leading-relaxed">
        {HMB_GUIDE_CONTENT.description}
      </p>

      <div className="grid gap-4 mb-8">
        {HMB_GUIDE_CONTENT.benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl">
            <span className="text-blue-600 font-bold">✓</span>
            <span className="text-sm text-blue-900 font-medium">{benefit}</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 text-white p-6 rounded-3xl">
        <div className="text-xs opacity-60 mb-1">권장 섭취법</div>
        <div className="font-bold text-lg">{HMB_GUIDE_CONTENT.usage}</div>
      </div>
    </div>
  );
}
