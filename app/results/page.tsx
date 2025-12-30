"use client";

import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generatePersonalizedRoadmap } from '@/lib/roadmap-engine';
import { HMB_GUIDE_CONTENT } from '@/lib/content';
import RoadmapChart from '@/components/RoadmapChart';
import DisclaimerModal from '@/components/DisclaimerModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 실제 로직을 담은 내부 컴포넌트
function ResultsContent() {
  const searchParams = useSearchParams();
  const [isAgreed, setIsAgreed] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // URL 파라미터로부터 사용자 데이터 추출
  const userData = {
    // 터제타파이드 및 세마글루타이드 구분
    drugType: (searchParams.get('drugType') as 'SEMAGLUTIDE' | 'TIRZEPATIDE') || 'TIRZEPATIDE',
    currentDose: parseFloat(searchParams.get('currentDose') || '2.5'),
    age: parseInt(searchParams.get('age') || '30'),
    gender: (searchParams.get('gender') as 'male' | 'female') || 'male',
    currentWeight: parseFloat(searchParams.get('weight') || '0'),
  };

  const result = generatePersonalizedRoadmap(userData);

  // PDF 생성 및 다운로드 함수
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // 고해상도 설정
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 가로 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`NextWeight_Report_${result.drugName}.pdf`);
    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <DisclaimerModal isOpen={!isAgreed} onConfirm={() => setIsAgreed(true)} />
      
      <div ref={reportRef} className="max-w-5xl mx-auto pt-12 px-6 bg-gray-50">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Personalized Roadmap</h1>
          <p className="text-gray-600 text-lg">
            {result.drugName} 관리를 위한 데이터 기반의 최적 경로입니다.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <RoadmapChart data={result.roadmap} drugName={result.drugName} />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h3 className="font-bold text-xl">상세 일정 가이드</h3>
              </div>
              <div className="divide-y">
                {result.roadmap.map((step) => (
                  <div key={step.week} className={`p-6 flex items-center ${step.week === "이번 주" ? 'bg-blue-50' : ''}`}>
                    <div className="w-24 font-bold text-gray-400">{step.week}</div>
                    <div className="flex-1">
                      <span className="text-2xl font-black text-blue-600">{step.dose}</span>
                      <span className="ml-1 text-sm font-bold text-gray-500">{step.unit}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${step.phase === '유지 관리기' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {step.phase}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-blue-900 text-white p-8 rounded-3xl shadow-lg">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="mr-2">🧪</span> {HMB_GUIDE_CONTENT.title}
              </h2>
              <div className="space-y-6 text-sm">
                {HMB_GUIDE_CONTENT.sections.map(section => (
                  <div key={section.id} className="border-b border-blue-800 pb-4 last:border-0">
                    <h4 className="font-bold text-blue-300 mb-2">{section.subtitle}</h4>
                    <p className="text-blue-100 leading-relaxed opacity-90">{section.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleDownloadPDF}
              className="w-full py-5 bg-white border-2 border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center"
            >
              <span className="mr-2">📄</span> PDF 리포트 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 빌드 에러 방지를 위해 Suspense로 감싸서 export
export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">개인별 리포트를 생성하고 있습니다...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
