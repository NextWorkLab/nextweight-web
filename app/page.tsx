// app/page.tsx
// 환자 중심 랜딩 페이지

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NextWeight | 환자 자가관리 플랫폼",
  description:
    "GLP-1 치료 중 일일 건강 상태를 기록하고, 진료 시 의료진과 안전하게 공유하세요.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-blue-600">Next</span>
            <span className="text-slate-900">Weight</span>
          </h1>
          <Link
            href="/auth"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            로그인
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-12 pb-10 flex flex-col">
        <div className="flex-1">
          <div className="mb-2">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              GLP-1 자가관리 플랫폼
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 leading-tight">
            기록하고,
            <br />
            공유하고,
            <br />
            <span className="text-blue-600">관리하세요.</span>
          </h2>
          <p className="mt-4 text-slate-500 leading-relaxed">
            복약, 오심, 체중을 매일 기록하고
            <br />
            진료 시 의료진과 안전하게 공유합니다.
          </p>

          {/* CTA 버튼 */}
          <div className="mt-8 space-y-3">
            <Link
              href="/auth?next=/app/record"
              className="flex items-center justify-center w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl text-base hover:bg-blue-700 transition-colors"
            >
              오늘 기록하기
            </Link>
            <Link
              href="/auth?next=/app/report"
              className="flex items-center justify-center w-full bg-white border border-gray-300 text-slate-700 font-semibold py-3.5 rounded-xl text-base hover:bg-gray-50 transition-colors"
            >
              진료용 리포트 보기
            </Link>
            <Link
              href="/auth"
              className="flex items-center justify-center w-full text-slate-500 text-sm py-2 hover:text-slate-700 transition-colors"
            >
              시작하기 / 로그인 →
            </Link>
          </div>

          {/* 기능 소개 */}
          <div className="mt-12 space-y-4">
            <FeatureRow
              icon="●"
              title="매일 60초 기록"
              desc="복약, 오심, 구토, 체중을 간단하게 기록합니다."
            />
            <FeatureRow
              icon="●"
              title="자동 리포트"
              desc="14일·30일 요약 리포트를 자동으로 생성합니다."
            />
            <FeatureRow
              icon="●"
              title="안전한 공유"
              desc="시간 제한 링크로 의료진에게만 공유합니다."
            />
            <FeatureRow
              icon="●"
              title="서버 저장"
              desc="데이터는 안전하게 서버에 보관됩니다."
            />
          </div>
        </div>

        {/* 푸터 */}
        <footer className="mt-12 pt-6 border-t border-gray-100 text-center space-y-2">
          <p className="text-xs text-slate-400">nextweight.co.kr</p>
          <div className="flex justify-center gap-4">
            <Link href="/legal/privacy" className="text-xs text-slate-400 hover:text-slate-600 underline">
              개인정보처리방침
            </Link>
            <Link href="/legal/terms" className="text-xs text-slate-400 hover:text-slate-600 underline">
              이용약관
            </Link>
          </div>
          <p className="text-xs text-slate-300">
            이 서비스는 의학적 조언을 제공하지 않습니다.
          </p>
        </footer>
      </main>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-blue-600 mt-0.5 text-xs">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
