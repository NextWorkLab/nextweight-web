// lib/qi-engine.ts
// 환자 상태 집계 및 신호색 산출 엔진

import type { 
  DailyResponse, 
  WeeklyResponse, 
  ComputedStatus, 
  SignalColor,
  ReportData,
  Patient
} from './types';

/**
 * 최근 N일간의 Daily 응답 집계
 */
export function computeLastNDays(
  patientCode: string,
  dailyResponses: DailyResponse[],
  days: number = 7
): ComputedStatus {
  // 해당 환자의 응답만 필터링
  const responses = dailyResponses
    .filter(r => r.patient_code === patientCode)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // 최근 N일 필터링
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentResponses = responses.filter(r => 
    new Date(r.timestamp) >= cutoffDate
  );

  // 투약 순응률 계산
  const totalResponses = recentResponses.length;
  const medicationTakenCount = recentResponses.filter(r => r.medication_taken).length;
  const adherenceRate = totalResponses > 0 
    ? Math.round((medicationTakenCount / totalResponses) * 100) 
    : 0;

  // 투약 누락 횟수
  const missedMedication = totalResponses - medicationTakenCount;

  // 오심 최대값
  const nauseaLevels = recentResponses.map(r => r.nausea_level);
  const maxNausea = nauseaLevels.length > 0 ? Math.max(...nauseaLevels) : 0;

  // 구토 횟수
  const vomitingCount = recentResponses.filter(r => r.vomiting).length;

  // 신호색 산출
  const { color, reasons } = calcSignalColor({
    vomitingCount,
    maxNausea,
    missedMedication,
    nauseaLevels,
    days,
  });

  // 최근 응답 날짜
  const lastDailyDate = responses.length > 0 ? responses[0].timestamp : undefined;
  const daysSinceLastDaily = lastDailyDate 
    ? Math.floor((Date.now() - new Date(lastDailyDate).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  return {
    patient_code: patientCode,
    signal_color: color,
    signal_reasons: reasons,
    adherence_rate_7d: adherenceRate,
    max_nausea_7d: maxNausea,
    vomiting_count_7d: vomitingCount,
    missed_medication_7d: missedMedication,
    last_daily_date: lastDailyDate,
    days_since_last_daily: daysSinceLastDaily,
  };
}

/**
 * 신호색 규칙 v1 (MVP 고정)
 */
interface SignalCalcInput {
  vomitingCount: number;
  maxNausea: number;
  missedMedication: number;
  nauseaLevels: number[];
  days: number;
}

function calcSignalColor(input: SignalCalcInput): { color: SignalColor; reasons: string[] } {
  const reasons: string[] = [];

  // RED 조건
  if (input.vomitingCount > 0) {
    reasons.push(`구토 발생 (${input.vomitingCount}회)`);
  }

  if (input.maxNausea >= 8) {
    reasons.push(`심한 오심 (최대 ${input.maxNausea}점)`);
  }

  if (input.missedMedication >= 2) {
    reasons.push(`투약 누락 (${input.missedMedication}회)`);
  }

  if (reasons.length > 0) {
    return { color: 'red', reasons };
  }

  // YELLOW 조건
  const moderateNauseaDays = input.nauseaLevels.filter(level => level >= 5 && level <= 7).length;
  
  if (moderateNauseaDays >= 2 || input.maxNausea >= 5) {
    reasons.push(`중등도 오심 (${moderateNauseaDays}일, 최대 ${input.maxNausea}점)`);
  }

  if (input.missedMedication === 1) {
    reasons.push('투약 누락 1회');
  }

  if (reasons.length > 0) {
    return { color: 'yellow', reasons };
  }

  // GREEN (정상)
  return { color: 'green', reasons: ['양호'] };
}

/**
 * 주간 응답 집계 (체중 변화 등)
 */
export function computeWeeklySummary(
  patientCode: string,
  weeklyResponses: WeeklyResponse[],
  weeks: number = 4
) {
  const responses = weeklyResponses
    .filter(r => r.patient_code === patientCode)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (weeks * 7));
  
  const recentResponses = responses.filter(r => 
    new Date(r.timestamp) >= cutoffDate
  );

  const lastWeeklyDate = responses.length > 0 ? responses[0].timestamp : undefined;
  const daysSinceLastWeekly = lastWeeklyDate 
    ? Math.floor((Date.now() - new Date(lastWeeklyDate).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  // 체중 변화 계산
  let weightChange: number | undefined;
  let weightChangePercent: number | undefined;

  if (recentResponses.length >= 2) {
    const latestWeight = recentResponses[0].weight_kg;
    const earliestWeight = recentResponses[recentResponses.length - 1].weight_kg;
    
    if (latestWeight > 0 && earliestWeight > 0) {
      weightChange = latestWeight - earliestWeight;
      weightChangePercent = (weightChange / earliestWeight) * 100;
    }
  }

  return {
    total_weekly_responses: recentResponses.length,
    last_weekly_date: lastWeeklyDate,
    days_since_last_weekly: daysSinceLastWeekly,
    weight_change: weightChange,
    weight_change_percent: weightChangePercent,
    latest_weight: recentResponses.length > 0 ? recentResponses[0].weight_kg : undefined,
    latest_body_fat: recentResponses.length > 0 ? recentResponses[0].body_fat_percent : undefined,
  };
}

/**
 * 리포트용 종합 데이터 생성
 */
export function generateReportData(
  patient: Patient,
  dailyResponses: DailyResponse[],
  weeklyResponses: WeeklyResponse[],
  weeks: number = 4
): ReportData {
  // Daily 집계
  const dailyStatus = computeLastNDays(patient.patient_code, dailyResponses, 7);
  
  // Weekly 집계
  const weeklySummary = computeWeeklySummary(patient.patient_code, weeklyResponses, weeks);
  
  // 기간 설정
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));

  // 해당 기간의 응답만 필터링
  const periodDailyResponses = dailyResponses
    .filter(r => r.patient_code === patient.patient_code)
    .filter(r => {
      const date = new Date(r.timestamp);
      return date >= startDate && date <= endDate;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const periodWeeklyResponses = weeklyResponses
    .filter(r => r.patient_code === patient.patient_code)
    .filter(r => {
      const date = new Date(r.timestamp);
      return date >= startDate && date <= endDate;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 차트 데이터 생성
  const dailyChartData = periodDailyResponses.map(r => ({
    date: new Date(r.timestamp).toLocaleDateString('ko-KR'),
    medication_taken: r.medication_taken,
    nausea_level: r.nausea_level,
    overall_condition: r.overall_condition,
  }));

  const weeklyChartData = periodWeeklyResponses.map(r => ({
    date: new Date(r.timestamp).toLocaleDateString('ko-KR'),
    weight_kg: r.weight_kg,
    body_fat_percent: r.body_fat_percent,
  }));

  // 요약 통계
  const totalMedTaken = periodDailyResponses.filter(r => r.medication_taken).length;
  const adherenceRate = periodDailyResponses.length > 0
    ? Math.round((totalMedTaken / periodDailyResponses.length) * 100)
    : 0;

  const avgNausea = periodDailyResponses.length > 0
    ? periodDailyResponses.reduce((sum, r) => sum + r.nausea_level, 0) / periodDailyResponses.length
    : 0;

  const avgCondition = periodDailyResponses.length > 0
    ? periodDailyResponses.reduce((sum, r) => sum + r.overall_condition, 0) / periodDailyResponses.length
    : 0;

  // ComputedStatus에 Weekly 정보 추가
  const computedStatus: ComputedStatus = {
    ...dailyStatus,
    last_weekly_date: weeklySummary.last_weekly_date,
    days_since_last_weekly: weeklySummary.days_since_last_weekly,
  };

  return {
    patient,
    computed_status: computedStatus,
    daily_responses: periodDailyResponses,
    weekly_responses: periodWeeklyResponses,
    period_weeks: weeks,
    period_start_date: startDate.toISOString(),
    period_end_date: endDate.toISOString(),
    daily_chart_data: dailyChartData,
    weekly_chart_data: weeklyChartData,
    summary: {
      total_daily_responses: periodDailyResponses.length,
      total_weekly_responses: periodWeeklyResponses.length,
      adherence_rate: adherenceRate,
      avg_nausea: Math.round(avgNausea * 10) / 10,
      avg_condition: Math.round(avgCondition * 10) / 10,
      weight_change: weeklySummary.weight_change,
      weight_change_percent: weeklySummary.weight_change_percent 
        ? Math.round(weeklySummary.weight_change_percent * 10) / 10
        : undefined,
    },
  };
}

/**
 * 대시보드용 환자 상태 일괄 계산
 */
export function computePatientStatuses(
  patientCodes: string[],
  dailyResponses: DailyResponse[],
  weeklyResponses: WeeklyResponse[]
): Map<string, ComputedStatus> {
  const statusMap = new Map<string, ComputedStatus>();

  for (const code of patientCodes) {
    const dailyStatus = computeLastNDays(code, dailyResponses, 7);
    const weeklySummary = computeWeeklySummary(code, weeklyResponses, 4);

    statusMap.set(code, {
      ...dailyStatus,
      last_weekly_date: weeklySummary.last_weekly_date,
      days_since_last_weekly: weeklySummary.days_since_last_weekly,
    });
  }

  return statusMap;
}
