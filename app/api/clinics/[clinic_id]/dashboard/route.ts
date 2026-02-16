// app/api/clinics/[clinic_id]/dashboard/route.ts
// Google Sheets 기반 병원 대시보드 API

import { NextRequest } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import {
  findPatientsByClinic,
  findDailyResponses,
  findWeeklyResponses,
} from '@/lib/sheets';
import { computePatientStatuses } from '@/lib/qi-engine';
import type { DashboardPatient } from '@/lib/types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clinic_id: string }> }
) {
  try {
    const { clinic_id } = await context.params;

    const authResult = authenticateRequest(request, clinic_id);
    if (!authResult.authenticated) return unauthorizedResponse(authResult.error);

    const url = new URL(request.url);
    const statusFilter = (url.searchParams.get('status') || '').trim();
    const colorFilter = (url.searchParams.get('color') || '').trim();

    // 1) 환자 로드
    const allPatients = await findPatientsByClinic(clinic_id);

    // status 필터
    const patientsAfterStatus = statusFilter
      ? allPatients.filter((p) => p.status === statusFilter)
      : allPatients;

    // 환자 0명이면 빈 결과 반환
    if (patientsAfterStatus.length === 0) {
      return Response.json({
        clinic_id,
        patients: [],
        total: 0,
        summary: { red: 0, yellow: 0, green: 0, active: 0, paused: 0, discharged: 0 },
      });
    }

    // 2) Daily/Weekly 응답 로드 (최근 7일 기준으로 신호색 계산)
    const patientCodes = patientsAfterStatus.map((p) => p.patient_code);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [dailyResponses, weeklyResponses] = await Promise.all([
      findDailyResponses(patientCodes, sevenDaysAgo),
      findWeeklyResponses(patientCodes, sevenDaysAgo),
    ]);

    // 3) 환자별 computed_status 계산
    const statusMap = computePatientStatuses(patientCodes, dailyResponses, weeklyResponses);

    const dashboardPatients: DashboardPatient[] = patientsAfterStatus.map((patient) => ({
      ...patient,
      computed_status: statusMap.get(patient.patient_code) || {
        patient_code: patient.patient_code,
        signal_color: 'green',
        signal_reasons: ['데이터 없음'],
        adherence_rate_7d: 0,
        max_nausea_7d: 0,
        vomiting_count_7d: 0,
        missed_medication_7d: 0,
      },
    }));

    // 4) 색상 필터
    const finalPatients = colorFilter
      ? dashboardPatients.filter((p) => p.computed_status.signal_color === colorFilter)
      : dashboardPatients;

    // 5) 요약 (전체 clinic 기준)
    const summary = {
      red: dashboardPatients.filter((p) => p.computed_status.signal_color === 'red').length,
      yellow: dashboardPatients.filter((p) => p.computed_status.signal_color === 'yellow').length,
      green: dashboardPatients.filter((p) => p.computed_status.signal_color === 'green').length,
      active: allPatients.filter((p) => p.status === 'active').length,
      paused: allPatients.filter((p) => p.status === 'paused').length,
      discharged: allPatients.filter((p) => p.status === 'discharged').length,
    };

    return Response.json({
      clinic_id,
      patients: finalPatients,
      total: finalPatients.length,
      summary,
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return Response.json(
      { error: 'Failed to fetch dashboard', details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
