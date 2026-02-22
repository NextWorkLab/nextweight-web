// app/app/page.tsx
// 앱 홈: 오늘 상태 카드, 최근 7일 요약, 기록/리포트 버튼

import { cookies } from "next/headers";
import { verifySessionCookie } from "@/lib/session";
import { getDailyLogs, getWeeklyLogs } from "@/lib/patient-airtable";
import Link from "next/link";

function signalBadge(color: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    green: { bg: "bg-emerald-100", text: "text-emerald-700", label: "정상" },
    yellow: { bg: "bg-amber-100", text: "text-amber-700", label: "주의" },
    red: { bg: "bg-red-100", text: "text-red-700", label: "경고" },
  };
  return map[color] || map.green;
}

export default async function AppHome() {
  const cookieStore = await cookies();
  const session = cookieStore.get("nw_session");
  const parsed = session?.value ? verifySessionCookie(session.value) : null;

  let recentLogs: Awaited<ReturnType<typeof getDailyLogs>> = [];
  let recentWeekly: Awaited<ReturnType<typeof getWeeklyLogs>> = [];
  let fetchError = false;

  if (parsed?.user_id) {
    try {
      [recentLogs, recentWeekly] = await Promise.all([
        getDailyLogs(parsed.user_id, 7),
        getWeeklyLogs(parsed.user_id, 30),
      ]);
    } catch {
      fetchError = true;
    }
  }

  // 신호 계산
  const last7 = recentLogs.slice(0, 7);
  const hasVomiting = last7.some((l) => l.vomiting);
  const maxNausea = Math.max(0, ...last7.map((l) => l.nausea_level));
  const missedCount = last7.filter((l) => !l.medication_taken).length;

  let signal = "green";
  if (hasVomiting || maxNausea >= 8 || missedCount >= 2) signal = "red";
  else if (last7.length < 3) signal = "yellow"; // 최근 7일 데이터 부족
  else if (maxNausea >= 5 || missedCount === 1) signal = "yellow";

  const badge = signalBadge(signal);
  const adherenceRate =
    last7.length > 0
      ? Math.round((last7.filter((l) => l.medication_taken).length / last7.length) * 100)
      : null;

  const latestWeight =
    recentWeekly.length > 0 ? recentWeekly[0].weight_kg : null;

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const todayLogged = recentLogs.some((l) => {
    const d = new Date(l.timestamp);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  return (
    <div className="space-y-4">
      {/* 날짜 */}
      <p className="text-xs text-slate-400 font-medium">{todayStr}</p>

      {/* 오늘 기록 여부 배너 */}
      {!todayLogged ? (
        <Link
          href="/app/record"
          className="block bg-blue-600 rounded-xl p-4 text-white hover:bg-blue-700 transition-colors"
        >
          <p className="text-xs font-medium opacity-80 mb-1">오늘 기록이 없습니다</p>
          <p className="font-semibold">지금 오늘 상태 기록하기 →</p>
        </Link>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-600 mb-0.5">오늘 기록 완료</p>
          <p className="text-sm text-emerald-800">오늘의 건강 상태가 저장되었습니다.</p>
        </div>
      )}

      {/* 상태 카드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">최근 7일 상태</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        {fetchError ? (
          <p className="text-xs text-slate-400">데이터를 불러올 수 없습니다.</p>
        ) : last7.length === 0 ? (
          <p className="text-xs text-slate-400">
            아직 기록이 없습니다.{" "}
            <Link href="/app/record" className="text-blue-600 underline">
              첫 기록 남기기
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="복약 순응률" value={adherenceRate !== null ? `${adherenceRate}%` : "—"} sub={`${last7.length}일 기록`} />
            <StatCard label="최대 오심" value={`${maxNausea}/10`} sub={hasVomiting ? "구토 발생" : "구토 없음"} alert={maxNausea >= 8} />
            <StatCard label="복약 누락" value={`${missedCount}회`} sub="최근 7일" alert={missedCount >= 2} />
            <StatCard label="최근 체중" value={latestWeight ? `${latestWeight} kg` : "—"} sub="주간 측정" />
          </div>
        )}
      </div>

      {/* 빠른 실행 버튼 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/app/record"
          className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <p className="text-xs text-slate-500 mb-1">데이터 입력</p>
          <p className="font-semibold text-slate-800 text-sm">오늘 기록</p>
        </Link>
        <Link
          href="/app/report"
          className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <p className="text-xs text-slate-500 mb-1">분석</p>
          <p className="font-semibold text-slate-800 text-sm">리포트 보기</p>
        </Link>
      </div>

      {/* 최근 기록 미리보기 */}
      {last7.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">최근 기록</h2>
            <Link href="/app/history" className="text-xs text-blue-600 hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-2">
            {last7.slice(0, 3).map((log) => (
              <div key={log.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                <span className="text-slate-500">
                  {new Date(log.timestamp).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                </span>
                <span className={`font-medium ${log.medication_taken ? "text-emerald-600" : "text-red-500"}`}>
                  {log.medication_taken ? "복약" : "미복약"}
                </span>
                <span className="text-slate-500">오심 {log.nausea_level}/10</span>
                {log.vomiting && <span className="text-red-500 font-medium">구토</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  alert = false,
}: {
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 ${alert ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${alert ? "text-red-600" : "text-slate-800"}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}
