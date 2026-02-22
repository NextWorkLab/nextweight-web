// lib/patient-report-engine.ts
// 환자 리포트 계산 엔진

import type { DailyLog, WeeklyLog, PatientReport, ReportPeriod, SignalResult } from "./patient-types";

export function computeSignal(logs: DailyLog[]): SignalResult {
  if (logs.length === 0) {
    return { color: "yellow", reasons: ["최근 7일 데이터 없음"] };
  }
  const reasons: string[] = [];
  const hasVomiting = logs.some((l) => l.vomiting);
  const maxNausea = Math.max(...logs.map((l) => l.nausea_level));
  const missedCount = logs.filter((l) => !l.medication_taken).length;

  if (hasVomiting) reasons.push("구토 발생");
  if (maxNausea >= 8) reasons.push(`오심 ${maxNausea}/10 (경고 수준)`);
  if (missedCount >= 2) reasons.push(`복약 누락 ${missedCount}회`);

  if (reasons.length > 0) return { color: "red", reasons };

  // Yellow conditions
  const moderateNausea = logs.filter((l) => l.nausea_level >= 5).length;
  if (moderateNausea >= 2) reasons.push("중등도 오심 2일 이상");
  if (missedCount === 1) reasons.push("복약 누락 1회");
  if (logs.length < 3) reasons.push("기록 부족 (7일 중 3일 미만)");

  if (reasons.length > 0) return { color: "yellow", reasons };
  return { color: "green", reasons: ["정상 범위"] };
}

export function generatePatientReport(
  user_id: string,
  dailyLogs: DailyLog[],
  weeklyLogs: WeeklyLog[],
  periodDays: ReportPeriod = 14
): PatientReport {
  const now = new Date();
  const sinceDate = new Date(now.getTime() - periodDays * 86400 * 1000);

  // 기간 내 필터링
  const filteredDaily = dailyLogs.filter(
    (l) => new Date(l.timestamp) >= sinceDate
  );
  const filteredWeekly = weeklyLogs.filter(
    (l) => new Date(l.timestamp) >= sinceDate
  );

  // 신호 계산 (최근 7일 기준)
  const last7Date = new Date(now.getTime() - 7 * 86400 * 1000);
  const last7Daily = dailyLogs.filter((l) => new Date(l.timestamp) >= last7Date);
  const signal = computeSignal(last7Daily);

  // 통계
  const medicationDays = filteredDaily.filter((l) => l.medication_taken).length;
  const adherenceRate =
    filteredDaily.length > 0 ? Math.round((medicationDays / filteredDaily.length) * 100) : 0;
  const avgNausea =
    filteredDaily.length > 0
      ? Math.round((filteredDaily.reduce((s, l) => s + l.nausea_level, 0) / filteredDaily.length) * 10) / 10
      : 0;
  const maxNausea = filteredDaily.length > 0 ? Math.max(...filteredDaily.map((l) => l.nausea_level)) : 0;
  const vomitingCount = filteredDaily.filter((l) => l.vomiting).length;
  const missedMedication = filteredDaily.filter((l) => !l.medication_taken).length;

  // 체중 변화 (주간 기록 기준)
  const sortedWeekly = [...filteredWeekly].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const weightStart = sortedWeekly[0]?.weight_kg;
  const weightLatest = sortedWeekly[sortedWeekly.length - 1]?.weight_kg;
  const weightChange =
    weightStart && weightLatest ? Math.round((weightLatest - weightStart) * 10) / 10 : undefined;

  // 차트 데이터 생성 (일자별 병합)
  const chartMap = new Map<
    string,
    { date: string; nausea_level?: number; medication_taken?: boolean; weight_kg?: number; vomiting?: boolean }
  >();

  for (const log of filteredDaily) {
    const date = log.timestamp.slice(0, 10);
    chartMap.set(date, {
      date,
      nausea_level: log.nausea_level,
      medication_taken: log.medication_taken,
      weight_kg: log.weight_kg,
      vomiting: log.vomiting,
    });
  }

  // 주간 기록의 체중도 차트에 병합
  for (const wl of filteredWeekly) {
    const date = wl.timestamp.slice(0, 10);
    const existing = chartMap.get(date) || { date };
    chartMap.set(date, { ...existing, weight_kg: wl.weight_kg });
  }

  const chartData = Array.from(chartMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    user_id,
    period_days: periodDays,
    period_start: sinceDate.toISOString(),
    period_end: now.toISOString(),
    daily_logs: filteredDaily,
    weekly_logs: filteredWeekly,
    signal,
    stats: {
      total_days: periodDays,
      records_count: filteredDaily.length,
      adherence_rate: adherenceRate,
      avg_nausea: avgNausea,
      max_nausea: maxNausea,
      vomiting_count: vomitingCount,
      missed_medication: missedMedication,
      weight_start: weightStart,
      weight_latest: weightLatest,
      weight_change: weightChange,
    },
    chart_data: chartData,
  };
}
