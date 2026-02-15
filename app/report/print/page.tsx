"use client";

import { useEffect } from "react";

export default function ReportPrintPage() {
  useEffect(() => {
    // 페이지 렌더 후 자동 인쇄 다이얼로그
    setTimeout(() => window.print(), 250);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="text-sm text-slate-500">
          인쇄 창이 뜨면 “대상: PDF로 저장”을 선택하세요.
        </div>
        <div className="mt-6 rounded-2xl border p-6">
          <div className="text-lg text-slate-900">리포트 내용</div>
          <div className="mt-2 text-sm text-slate-700">
            이 페이지는 /report 페이지와 동일한 리포트 컴포넌트를 재사용하도록 확장하면 됩니다.
            (MVP에서는 여기 내용을 간단히 둬도 됩니다.)
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </main>
  );
}
