// app/legal/privacy/page.tsx
// 개인정보처리방침

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | NextWeight",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">←</Link>
          <h1 className="text-base font-semibold text-slate-800">개인정보처리방침</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 prose prose-sm prose-slate max-w-none">
          <p className="text-sm text-slate-500 mb-6">최종 업데이트: 2025년 1월</p>

          <h2>1. 수집하는 개인정보</h2>
          <p>NextWeight는 서비스 제공을 위해 다음 정보를 수집합니다.</p>
          <ul>
            <li>휴대폰 번호 (인증 및 계정 식별 목적)</li>
            <li>건강 기록 (복약 여부, 오심 수준, 구토 여부, 체중)</li>
          </ul>

          <h2>2. 수집 목적</h2>
          <ul>
            <li>본인 인증 및 계정 관리</li>
            <li>건강 상태 기록 및 리포트 생성</li>
            <li>의료진 공유 기능 제공</li>
          </ul>

          <h2>3. 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴 시 또는 수집 목적 달성 시까지 보유합니다. 법령에 따라
            일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.
          </p>

          <h2>4. 제3자 제공</h2>
          <p>
            이용자가 직접 생성한 공유 링크를 통해 의료진에게 기록을 공유하는
            경우를 제외하고, 수집된 정보를 제3자에게 제공하지 않습니다.
          </p>

          <h2>5. 안전조치</h2>
          <p>
            모든 데이터는 암호화된 통신(HTTPS)을 통해 전송되며, 서버 접근은
            제한된 인원에게만 허용됩니다.
          </p>

          <h2>6. 이용자 권리</h2>
          <p>이용자는 언제든지 자신의 정보에 대한 열람, 수정, 삭제를 요청할 수 있습니다.</p>

          <h2>7. 문의</h2>
          <p>개인정보 관련 문의는 서비스 내 문의 채널을 통해 접수할 수 있습니다.</p>

          <h2>8. 의료 면책</h2>
          <p>
            NextWeight는 의학적 진단이나 치료를 제공하지 않습니다. 건강에
            관한 모든 결정은 담당 의료진과 상담하세요.
          </p>
        </div>
      </main>
    </div>
  );
}
