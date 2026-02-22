// app/legal/terms/page.tsx
// 이용약관

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 | NextWeight",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">←</Link>
          <h1 className="text-base font-semibold text-slate-800">이용약관</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 prose prose-sm prose-slate max-w-none">
          <p className="text-sm text-slate-500 mb-6">최종 업데이트: 2025년 1월</p>

          <h2>1. 서비스 개요</h2>
          <p>
            NextWeight(이하 "서비스")는 GLP-1 계열 약물 치료 중인 환자가 일상적인
            건강 상태를 기록하고 의료진과 공유할 수 있도록 돕는 디지털 헬스 플랫폼입니다.
          </p>

          <h2>2. 이용 대상</h2>
          <p>
            본 서비스는 만 19세 이상의 성인을 대상으로 합니다. 휴대폰 인증을 통해
            회원으로 가입한 경우에만 이용할 수 있습니다.
          </p>

          <h2>3. 서비스 이용</h2>
          <ul>
            <li>이용자는 정확한 정보를 입력해야 합니다.</li>
            <li>타인의 정보를 도용하거나 허위 정보를 입력해서는 안 됩니다.</li>
            <li>서비스를 상업적 목적으로 무단 이용해서는 안 됩니다.</li>
          </ul>

          <h2>4. 의료 면책</h2>
          <p>
            NextWeight는 의학적 진단, 처방, 또는 치료를 제공하지 않습니다. 서비스
            내 정보는 참고 목적으로만 사용되어야 하며, 모든 의료적 결정은 반드시
            담당 의료진과 상담 후 이루어져야 합니다.
          </p>

          <h2>5. 공유 기능</h2>
          <p>
            이용자가 생성한 공유 링크를 통해 제3자에게 제공된 정보에 대한 책임은
            이용자에게 있습니다. 공유 링크는 만료 후 자동으로 비활성화됩니다.
          </p>

          <h2>6. 서비스 변경 및 중단</h2>
          <p>
            운영상, 기술적 필요에 따라 서비스 내용을 변경하거나 일시 중단할 수 있습니다.
            중요한 변경 사항은 사전 공지합니다.
          </p>

          <h2>7. 약관 변경</h2>
          <p>
            약관이 변경될 경우 서비스 내 공지를 통해 알립니다. 변경 후 서비스 이용을
            계속하면 변경된 약관에 동의한 것으로 간주합니다.
          </p>

          <h2>8. 준거법</h2>
          <p>본 약관은 대한민국 법률을 준거법으로 합니다.</p>
        </div>
      </main>
    </div>
  );
}
