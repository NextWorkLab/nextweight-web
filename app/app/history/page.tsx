// app/app/history/page.tsx
// 기록 내역 목록

import { cookies } from "next/headers";
import { verifySessionCookie } from "@/lib/session";
import { getDailyLogs, getWeeklyLogs } from "@/lib/patient-airtable";
import Link from "next/link";

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("nw_session");
  const parsed = session?.value ? verifySessionCookie(session.value) : null;

  let dailyLogs: Awaited<ReturnType<typeof getDailyLogs>> = [];
  let weeklyLogs: Awaited<ReturnType<typeof getWeeklyLogs>> = [];
  let fetchError = false;

  if (parsed?.user_id) {
    try {
      [dailyLogs, weeklyLogs] = await Promise.all([
        getDailyLogs(parsed.user_id, 30),
        getWeeklyLogs(parsed.user_id, 60),
      ]);
    } catch {
      fetchError = true;
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">기록 내역</h1>
        <Link href="/app/record" className="text-sm text-blue-600 font-medium hover:underline">
          + 기록하기
        </Link>
      </div>

      {fetchError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
          데이터를 불러오는 중 오류가 발생했습니다.
        </p>
      )}

      {/* 일일 기록 */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          일일 기록 (최근 30일)
        </h2>
        {dailyLogs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-sm text-slate-400">일일 기록이 없습니다.</p>
            <Link href="/app/record" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              첫 기록 남기기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {dailyLogs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(log.timestamp).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    <span className={`text-xs ${log.medication_taken ? "text-emerald-600" : "text-red-500"} font-medium`}>
                      {log.medication_taken ? "복약 완료" : "미복약"}
                    </span>
                    <span className="text-xs text-slate-400">오심 {log.nausea_level}/10</span>
                    {log.vomiting && <span className="text-xs text-red-500 font-medium">구토</span>}
                    {log.weight_kg && <span className="text-xs text-slate-400">{log.weight_kg} kg</span>}
                  </div>
                </div>
                <NauseaDot level={log.nausea_level} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 주간 기록 */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          주간 기록 (최근 60일)
        </h2>
        {weeklyLogs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-sm text-slate-400">주간 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {weeklyLogs.map((log) => (
              <div key={log.id} className="px-4 py-3">
                <p className="text-sm font-medium text-slate-800">
                  {new Date(log.timestamp).toLocaleDateString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  <span className="text-xs text-blue-600 font-medium">{log.weight_kg} kg</span>
                  <span className="text-xs text-slate-400">식욕 {log.appetite_change}</span>
                  <span className="text-xs text-slate-400">운동 {log.exercise_frequency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NauseaDot({ level }: { level: number }) {
  const color =
    level >= 8 ? "bg-red-500" : level >= 5 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} title={`오심 ${level}`} />
  );
}
