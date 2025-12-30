"use client";

interface DisclaimerModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export default function DisclaimerModal({ isOpen, onConfirm }: DisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ 확인 및 동의 필수</h2>
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed mb-8">
          <p>• NextWeight는 비의료 건강관리 서비스이며, 의사의 진단이나 처방을 대신하지 않습니다.</p>
          <p>• 본 리포트의 용량 가이드는 학술적 데이터를 기반으로 한 <strong>참고용 정보</strong>입니다.</p>
          <p>• 약물 투여 및 용량 조절은 반드시 <strong>담당 전문의의 지시</strong>에 따라야 합니다.</p>
          <p>• 본 정보를 임의로 해석하여 발생한 결과에 대해 당사는 책임을 지지 않습니다.</p>
        </div>
        <button 
          onClick={onConfirm}
          className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all"
        >
          위 내용을 확인했으며 동의합니다
        </button>
      </div>
    </div>
  );
}
