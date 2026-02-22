// app/api/clinics/[clinic_id]/dashboard/route.ts
// Airtable 기반 병원 대시보드 API

import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorized } from '@/lib/auth';
import {
  tables,
  fetchAll,
  PatientFields,
  DailyResponseFields,
  WeeklyResponseFields,
} from '@/lib/airtable';
import type { DashboardPatient } from '@/lib/types';

type SignalColor = 'red' | 'yellow' | 'green';

function s(v: any) {
  return String(v ?? '').trim();
}
function upper(v: any) {
  return s(v).toUpperCase();
}
function parseDateSafe(value: any): Date | null {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
function diffDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// Airtable link 필드(patient)가 record id 배열로 오든 문자열로 오든 매칭
function linkHasPatient(patientField: any, patientRecordId: string) {
  if (!patientField) return false;
  const id = s(patientRecordId);

  if (Array.isArray(patientField)) {
    return patientField.some((v) => s(v) === id);
  }
  return s(patientField).includes(id);
}

function normalizeStatus(raw: any): '' | 'active' | 'paused' | 'discharged' {
  const v = s(raw);

  const low = v.toLowerCase();
  if (low === 'active' || low === 'paused' || low === 'discharged') return low as any;

  if (v === '활성') return 'active';
  if (v === '중단') return 'paused';
  if (v === '종료') return 'discharged';

  return '';
}

function getPatientStatus(p: any) {
  // Airtable에서 필드명이 여러 케이스로 섞일 수 있어 최대한 방어적으로 읽기
  return normalizeStatus(
    p?.status ??
      p?.Status ??
      p?.Select ??
      p?.select ??
      p?.STATUS ??
      p?.['상태'] ??
      p?.['patient_status']
  );
}

function inClinicByFallback(p: any, clinic_id: string) {
  // 1) clinic_id / clinic 문자열 필드가 있으면 우선 사용
  const c1 = s(p?.clinic_id);
  const c2 = s(p?.clinic);

  if (upper(c1) === upper(clinic_id)) return true;
  if (upper(c2) === upper(clinic_id)) return true;

  // 2) clinic이 링크 필드라면 record id 배열로 올 수도 있음 -> 여기서는 비교 불가
  // 3) 대신 patient_code prefix로 확실하게 잡기 (C001-xxxx)
  const pc = s(p?.patient_code);
  if (pc && upper(pc).startsWith(upper(clinic_id) + '-')) return true;

  return false;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clinic_id: string }> }
) {
  try {
    const { clinic_id } = await context.params;

    const authResult = authenticateRequest(request, clinic_id);
    if (!authResult.authenticated) return unauthorized(authResult.error);

    const url = new URL(request.url);
    const weeks = parseInt(url.searchParams.get('weeks') || '4', 10);
    const statusFilter = s(url.searchParams.get('status') || ''); // active, paused, discharged, ''(전체)
    const colorFilter = s(url.searchParams.get('color') || ''); // red, yellow, green, ''(전체)
    const debug = url.searchParams.get('debug') === '1';

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    // 1) 환자 로드 + clinic 매칭(문자/링크 혼재 대비해서 prefix fallback)
    const allPatients = await fetchAll<PatientFields>(tables.Patients);
    const patientsInClinic = allPatients.filter((p) => inClinicByFallback(p as any, clinic_id));

    // status 필터 (프론트 기본값이 active면 여기서 걸러질 수 있음)
    const patientsAfterStatus =
      statusFilter ? patientsInClinic.filter((p) => getPatientStatus(p) === statusFilter) : patientsInClinic;

    // 환자 0명이면 200으로 빈 결과 반환
    if (patientsAfterStatus.length === 0) {
      return Response.json({
        clinic_id,
        patients: [],
        total: 0,
        summary: { red: 0, yellow: 0, green: 0, active: 0, paused: 0, discharged: 0 },
        ...(debug
          ? {
              debug: {
                weeks,
                statusFilter,
                colorFilter,
                allPatients: allPatients.length,
                patientsInClinic: patientsInClinic.length,
                patientsAfterStatus: patientsAfterStatus.length,
                sample: allPatients.slice(0, 10).map((p: any) => ({
                  id: p.id,
                  patient_code: p.patient_code,
                  clinic_id: p.clinic_id,
                  clinic: p.clinic,
                  status_raw: p.status ?? p.Status ?? p.Select ?? p['상태'],
                  status_norm: getPatientStatus(p),
                })),
              },
            }
          : {}),
      });
    }

    // 2) Daily/Weekly 로드 (기간 내 + 해당 환자 링크만)
    const allDaily = await fetchAll<DailyResponseFields>(tables.DailyResponses);
    const allWeekly = await fetchAll<WeeklyResponseFields>(tables.WeeklyResponses);

    const patientIdSet = new Set(patientsAfterStatus.map((p) => s((p as any).id)));

    const dailyInRange = allDaily.filter((r) => {
      const pf = (r as any).patient;
      const linkedIds = Array.isArray(pf) ? pf.map(s) : [s(pf)];
      const anyMatch = linkedIds.some((id) => patientIdSet.has(id));
      if (!anyMatch) return false;

      const d = parseDateSafe((r as any).timestamp);
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });

    const weeklyInRange = allWeekly.filter((r) => {
      const pf = (r as any).patient;
      const linkedIds = Array.isArray(pf) ? pf.map(s) : [s(pf)];
      const anyMatch = linkedIds.some((id) => patientIdSet.has(id));
      if (!anyMatch) return false;

      const d = parseDateSafe((r as any).timestamp);
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });

    // 3) 최근 7일
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 4) 환자별 computed_status
    const dashboardPatients: DashboardPatient[] = patientsAfterStatus.map((patient) => {
      const pid = s((patient as any).id);
      const pcode = s((patient as any).patient_code);

      const myDaily = dailyInRange.filter((r) => linkHasPatient((r as any).patient, pid));
      const myWeekly = weeklyInRange.filter((r) => linkHasPatient((r as any).patient, pid));

      const recent7 = myDaily.filter((r) => {
        const d = parseDateSafe((r as any).timestamp);
        return d ? d >= sevenDaysAgo : false;
      });

      const hasVomiting = recent7.some((r) => (r as any).vomiting === '예');
      const maxNausea = Math.max(...recent7.map((r) => (r as any).nausea_level || 0), 0);
      const missedMeds = recent7.filter((r) => (r as any).medication_taken === '아니오').length;

      let signal_color: SignalColor = 'green';
      const signal_reasons: string[] = [];

 if (recent7.length === 0) {
  signal_color = 'yellow';
  signal_reasons.push('최근 7일 데이터 없음');
      } else {
        if (hasVomiting) signal_reasons.push('구토 발생');
        if (maxNausea >= 8) signal_reasons.push('오심 고도');
        if (missedMeds >= 2) signal_reasons.push('투약 누락 다수');

        if (hasVomiting || maxNausea >= 8 || missedMeds >= 2) {
          signal_color = 'red';
        } else if (
          recent7.filter((r) => ((r as any).nausea_level || 0) >= 5).length >= 2 ||
          maxNausea >= 5 ||
          missedMeds === 1
        ) {
          signal_color = 'yellow';
          if (signal_reasons.length === 0) signal_reasons.push('주의 필요');
        } else {
          signal_color = 'green';
          signal_reasons.push('안정');
        }
      }

      const adherence_rate_7d =
        recent7.length > 0
          ? Math.round(
              (recent7.filter((r) => (r as any).medication_taken === '예').length / recent7.length) * 100
            )
          : 0;

      const lastDailyDate = myDaily
        .map((r) => parseDateSafe((r as any).timestamp))
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0] as Date | undefined;

      const lastWeeklyDate = myWeekly
        .map((r) => parseDateSafe((r as any).timestamp))
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0] as Date | undefined;

      const computed_status: any = {
        patient_code: pcode,
        signal_color,
        signal_reasons,
        adherence_rate_7d,
        max_nausea_7d: maxNausea,
        vomiting_count_7d: recent7.filter((r) => (r as any).vomiting === '예').length,
        missed_medication_7d: missedMeds,
        days_since_last_daily: lastDailyDate ? diffDays(lastDailyDate, endDate) : undefined,
        days_since_last_weekly: lastWeeklyDate ? diffDays(lastWeeklyDate, endDate) : undefined,
      };

      return {
        ...(patient as any),
        computed_status,
      };
    });

    // 5) 색상 필터
    const finalPatients = colorFilter
      ? dashboardPatients.filter((p) => p.computed_status.signal_color === colorFilter)
      : dashboardPatients;

    // 6) 요약(해당 clinic 전체 기준)
    const summary = {
      red: dashboardPatients.filter((p) => p.computed_status.signal_color === 'red').length,
      yellow: dashboardPatients.filter((p) => p.computed_status.signal_color === 'yellow').length,
      green: dashboardPatients.filter((p) => p.computed_status.signal_color === 'green').length,
      active: patientsInClinic.filter((p) => getPatientStatus(p) === 'active').length,
      paused: patientsInClinic.filter((p) => getPatientStatus(p) === 'paused').length,
      discharged: patientsInClinic.filter((p) => getPatientStatus(p) === 'discharged').length,
    };

    return Response.json({
      clinic_id,
      patients: finalPatients,
      total: finalPatients.length,
      summary,
      ...(debug
        ? {
            debug: {
              weeks,
              statusFilter,
              colorFilter,
              allPatients: allPatients.length,
              patientsInClinic: patientsInClinic.length,
              patientsAfterStatus: patientsAfterStatus.length,
              dailyTotal: allDaily.length,
              weeklyTotal: allWeekly.length,
              dailyInRange: dailyInRange.length,
              weeklyInRange: weeklyInRange.length,
            },
          }
        : {}),
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return Response.json(
      { error: 'Failed to fetch dashboard', details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
