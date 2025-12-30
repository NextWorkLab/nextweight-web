"use client";

import { useState } from "react";

interface OnboardingFormProps {
  onComplete: (data: any) => void;
}

export default function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    drugType: "TIRZEPATIDE",
    gender: "male",
    age: "",
    weight: "",
    currentDose: "", // 현재 투여 중인 용량
    muscleStatus: "normal",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-2 flex-1 mx-1 rounded-full ${step >= i ? "bg-blue-600" : "bg-gray-200"}`} />
          ))}
        </div>
        <p className="text-sm text-gray-500 text-center">단계 {step} / 3</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">어떤 성분을 복용 중이신가요?</h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={() => { setFormData({ ...formData, drugType: "SEMAGLUTIDE" }); setStep(2); }}
                className={`p-4 border-2 rounded-xl text-left transition-all ${formData.drugType === "SEMAGLUTIDE" ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
              >
                <p className="font-bold text-lg">세마글루타이드 (Semaglutide)</p>
                <p className="text-sm text-gray-500">위고비, 오젬픽 등</p>
              </button>
              <button
                type="button"
                onClick={() => { setFormData({ ...formData, drugType: "TIRZEPATIDE" }); setStep(2); }}
                className={`p-4 border-2 rounded-xl text-left transition-all ${formData.drugType === "TIRZEPATIDE" ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
              >
                <p className="font-bold text-lg">터제타파이드 (Tirzepatide)</p>
                <p className="text-sm text-gray-500">마운자로, 젭바운드 등</p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeIn space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">기본 정보를 입력해주세요</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number" placeholder="만 나이"
                className="p-3 border rounded-lg"
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
              <select className="p-3 border rounded-lg" onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>
            <input
              type="number" placeholder="현재 체중 (kg)"
              className="w-full p-3 border rounded-lg"
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
            <button type="button" onClick={() => setStep(3)} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">다음 단계</button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fadeIn space-y-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">현재 관리 상태</h2>
            <label className="block text-sm font-medium">현재 투여 용량 ({formData.drugType === "TIRZEPATIDE" ? "mg" : "mg"})</label>
            <input
              type="number" step="0.1" placeholder="예: 5.0"
              className="w-full p-3 border rounded-lg"
              onChange={(e) => setFormData({ ...formData, currentDose: e.target.value })}
            />
            <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-lg font-bold">분석 결과 보기</button>
            <button type="button" onClick={() => setStep(2)} className="w-full text-gray-400 text-sm">이전으로</button>
          </div>
        )}
      </form>
    </div>
  );
}
