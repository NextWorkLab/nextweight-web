"use client";

// app/app/report/page.tsx
// 환자 리포트 화면 (14일 / 30일)

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import Link from "next/link";
import type { PatientReport } from "@/lib/patient-types";

type Period = 14 | 30;

const SIGNAL_STYLES = {
  green: { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", label: "정상" },
  yellow: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700", label: "주의" },
  red: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-700", label: "경고" },
};

export default function ReportPage() {
  const [period, setPeriod] = useState<Period>(14);
  const [report, setReport] = useState<PatientReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (days: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/report?days=${days}`);
      if (!res.ok) throw new Error("리포트를 불러올 수 없습니다.");
      const data = await res.json();
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(period);
  }, [period, fetchReport]);

  const signal = report?.signal.color || "green";
  const style = SIGNAL_STYLES[signal];

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">리포트</h1>
        <Link href="/app/share" className="text-sm text-blue-600 font-medium hover:underline">
          공유하기
        </Link>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2">
        {([14, 30] as Period[]).map((d) => (
          <button
            key={d}
            onClick={() => setPeriod(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              period === d
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {d}일
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-sm text-slate-400">리포트를 불러오는 중...</div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && report && (
        <>
          {/* 신호 상태 */}
          <div className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${style.dot}`} />
              <span className={`text-sm font-semibold ${style.text}`}>현재 상태: {style.label}</span>
            </div>
            {report.signal.reasons.length > 0 && (
              <ul className={`text-xs space-y-0.5 ${style.text} opacity-80`}>
                {report.signal.reasons.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 핵심 지표 */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="복약 순응률"
              value={`${report.stats.adherence_rate}%`}
              sub={`${report.stats.records_count}일 기록`}
              alert={report.stats.adherence_rate < 70}
            />
            <StatCard
              label="평균 오심"
              value={`${report.stats.avg_nausea}/10`}
              sub={`최대 ${report.stats.max_nausea}`}
              alert={report.stats.max_nausea >= 8}
            />
            <StatCard
              label="구토 횟수"
              value={`${report.stats.vomiting_count}회`}
              sub={`${period}일 누적`}
              alert={report.stats.vomiting_count > 0}
            />
            {report.stats.weight_change !== undefined ? (
              <StatCard
                label="체중 변화"
                value={`${report.stats.weight_change > 0 ? "+" : ""}${report.stats.weight_change} kg`}
                sub={`${report.stats.weight_latest} kg`}
                alert={report.stats.weight_change > 0}
              />
            ) : (
              <StatCard label="체중 변화" value="—" sub="주간 기록 필요" />
            )}
          </div>

          {/* 오심 그래프 */}
          {report.chart_data.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">오심 추이</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={report.chart_data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    formatter={(v: unknown) => [`${v}/10`, "오심"]}
                    labelFormatter={(l: string) => l}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "경고", position: "right", fontSize: 10, fill: "#ef4444" }} />
                  <Line
                    type="monotone"
                    dataKey="nausea_level"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#3b82f6" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 체중 그래프 */}
          {report.chart_data.some((d) => d.weight_kg !== undefined) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">체중 추이</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={report.chart_data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(v: unknown) => [`${v} kg`, "체중"]}
                    labelFormatter={(l: string) => l}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight_kg"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#10b981" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 인쇄/PDF 버튼 */}
          <button
            onClick={() => window.print()}
            className="w-full border border-gray-300 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-gray-50 transition-colors print:hidden"
          >
            인쇄 / PDF 저장
          </button>
        </>
      )}

      {!loading && !error && report && report.stats.records_count === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-slate-500 mb-3">선택한 기간에 기록이 없습니다.</p>
          <Link href="/app/record" className="text-sm text-blue-600 hover:underline">
            지금 기록하기
          </Link>
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
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 ${alert ? "bg-red-50 border border-red-100" : "bg-white border border-gray-200"}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${alert ? "text-red-600" : "text-slate-800"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
