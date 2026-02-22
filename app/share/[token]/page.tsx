// app/share/[token]/page.tsx
// 공유 토큰 기반 읽기 전용 리포트 (인증 불필요)

import { notFound } from "next/navigation";
import type { PatientReport } from "@/lib/patient-types";

const SIGNAL_STYLES = {
  green: { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", label: "정상" },
  yellow: { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-700", label: "주의" },
  red: { bg: "bg-red-50 border-red-200", dot: "bg-red-500", text: "text-red-700", label: "경고" },
};

async function fetchSharedReport(
  token: string
): Promise<{ report: PatientReport; expires_at: string } | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/share/${token}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await fetchSharedReport(token);

  if (!data) {
    notFound();
  }

  const { report, expires_at } = data;
  const signal = report.signal.color;
  const style = SIGNAL_STYLES[signal];
  const expiresAt = new Date(expires_at).toLocaleString("ko-KR");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">
              <span className="text-blue-600">Next</span>Weight
            </h1>
            <p className="text-xs text-slate-400">공유된 리포트 (읽기 전용)</p>
          </div>
          <span className="text-xs text-slate-400 text-right">
            만료: {expiresAt}
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* 안내 배너 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          이 리포트는 환자가 생성한 공유 링크를 통해 제공됩니다. 최근 14일 기록을 기반으로 합니다.
        </div>

        {/* 신호 상태 */}
        <div className={`rounded-xl border p-4 ${style.bg}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-3 h-3 rounded-full ${style.dot}`} />
            <span className={`text-sm font-semibold ${style.text}`}>
              현재 상태: {style.label}
            </span>
          </div>
          {report.signal.reasons.length > 0 && (
            <ul className={`text-xs space-y-0.5 ${style.text} opacity-80`}>
              {report.signal.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          )}
        </div>

        {/* 핵심 통계 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">14일 요약</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <Stat label="기록 일수" value={`${report.stats.records_count}일`} sub={`/ ${report.stats.total_days}일`} />
            <Stat label="복약 순응률" value={`${report.stats.adherence_rate}%`} alert={report.stats.adherence_rate < 70} />
            <Stat label="평균 오심" value={`${report.stats.avg_nausea}/10`} sub={`최대 ${report.stats.max_nausea}`} />
            <Stat label="구토 횟수" value={`${report.stats.vomiting_count}회`} alert={report.stats.vomiting_count > 0} />
            <Stat label="복약 누락" value={`${report.stats.missed_medication}회`} alert={report.stats.missed_medication >= 2} />
            {report.stats.weight_change !== undefined ? (
              <Stat
                label="체중 변화"
                value={`${report.stats.weight_change > 0 ? "+" : ""}${report.stats.weight_change} kg`}
                sub={`현재 ${report.stats.weight_latest} kg`}
              />
            ) : (
              <Stat label="체중 변화" value="—" sub="주간 기록 없음" />
            )}
          </div>
        </div>

        {/* 일일 기록 상세 */}
        {report.daily_logs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">일일 기록</h2>
            <div className="space-y-2">
              {report.daily_logs.slice(0, 14).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-slate-500 w-20 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" })}
                  </span>
                  <span className={`font-medium ${log.medication_taken ? "text-emerald-600" : "text-red-500"}`}>
                    {log.medication_taken ? "복약" : "미복약"}
                  </span>
                  <span className="text-slate-500">오심 {log.nausea_level}</span>
                  <span className={log.vomiting ? "text-red-500 font-medium" : "text-slate-300"}>
                    {log.vomiting ? "구토" : "—"}
                  </span>
                  {log.weight_kg && (
                    <span className="text-slate-400">{log.weight_kg}kg</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인쇄 버튼 */}
        <button
          onClick={() => typeof window !== "undefined" && window.print()}
          className="w-full border border-gray-300 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors print:hidden"
        >
          인쇄 / PDF 저장
        </button>

        <p className="text-center text-xs text-slate-400 print:hidden">
          NextWeight · nextweight.co.kr
        </p>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  alert = false,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-base font-bold ${alert ? "text-red-600" : "text-slate-800"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
