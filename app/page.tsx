"use client";

import { useRouter } from 'next/navigation';
import OnboardingForm from '@/components/OnboardingForm';

export default function Home() {
  const router = useRouter();

  const handleOnboardingComplete = (data: any) => {
    // 입력 데이터를 URL 파라미터로 변환하여 결과 페이지로 이동
    const params = new URLSearchParams({
      drugType: data.drugType,
      currentDose: data.currentDose,
      age: data.age,
      gender: data.gender,
      weight: data.weight
    });
    
    router.push(`/results?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 px-6 text-center bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">
          Next Weight Lab
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          터제타파이드 및 세마글루타이드 치료 후의 삶을 설계합니다.<br/>
          과학적 근거에 기반한 <strong>대사 가교(Metabolic Bridge)</strong> 로드맵을 확인하세요.
        </p>
      </section>

      {/* Onboarding Section */}
      <section className="pb-20 px-6">
        <OnboardingForm onComplete={handleOnboardingComplete} />
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-blue-600 font-bold mb-2">Data-Driven</div>
            <p className="text-sm text-gray-500">최신 임상 논문(SURMOUNT, STEP) 기반 알고리즘</p>
          </div>
          <div>
            <div className="text-blue-600 font-bold mb-2">Safe Tapering</div>
            <p className="text-sm text-gray-500">부작용 최소화를 위한 개인별 용량 조절 가이드</p>
          </div>
          <div>
            <div className="text-blue-600 font-bold mb-2">Muscle Care</div>
            <p className="text-sm text-gray-500">근손실 방지를 위한 HMB 하이브리드 전략</p>
          </div>
        </div>
      </section>
    </main>
  );
}
