// app/api/clinics/[clinic_id]/dashboard/route.ts
// 병원 대시보드 API - 환자 목록 및 상태 요약

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import { findPatientsByClinic, findDailyResponses, findWeeklyResponses, getDateRange } from '@/lib/sheets';
import { computePatientStatuses } from '@/lib/qi-engine';
import type { DashboardPatient } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinic_id: string }> }
) {
  const { clinic_id } = await params;
 
  try {
    // 1. 인증 확인
const authResult = authenticateRequest(request, clinic_id);
    if (!authResult.authenticated) {
      return unauthorizedResponse(authResult.error);
    }

    const clinicId = params.clinic_id;

    // 2. 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') || '4');
    const statusFilter = searchParams.get('status'); // active, paused, discharged
    const colorFilter = searchParams.get('color'); // red, yellow, green

    // 3. 환자 목록 조회
    const patients = await findPatientsByClinic(clinicId);
    
    if (!patients || patients.length === 0) {
      return NextResponse.json({
        clinic_id: clinicId,
        patients: [],
        total: 0,
        summary: {
          red: 0,
          yellow: 0,
          green: 0,
          active: 0,
          paused: 0,
          discharged: 0,
        },
      });
    }

    // 4. 응답 데이터 조회 (최근 N주)
    const patientCodes = patients.map(p => p.patient_code);
    const { start } = getDateRange(weeks);
    
    const [dailyResponses, weeklyResponses] = await Promise.all([
      findDailyResponses(patientCodes, start),
      findWeeklyResponses(patientCodes, start),
    ]);

    // 5. 환자별 상태 계산
    const statusMap = computePatientStatuses(patientCodes, dailyResponses, weeklyResponses);

    // 6. Dashboard 데이터 조합
    const dashboardPatients: DashboardPatient[] = patients.map(patient => {
      const computed_status = statusMap.get(patient.patient_code) || {
        patient_code: patient.patient_code,
        signal_color: 'green',
        signal_reasons: ['데이터 없음'],
        adherence_rate_7d: 0,
        max_nausea_7d: 0,
        vomiting_count_7d: 0,
        missed_medication_7d: 0,
      };

      return {
        ...patient,
        computed_status,
      };
    });

    // 7. 필터링
    let filteredPatients = dashboardPatients;

    if (statusFilter) {
      filteredPatients = filteredPatients.filter(p => p.status === statusFilter);
    }

    if (colorFilter) {
      filteredPatients = filteredPatients.filter(p => p.computed_status.signal_color === colorFilter);
    }

    // 8. 정렬: red 우선, 최근 응답 오래된 순
    filteredPatients.sort((a, b) => {
      // 신호색 우선순위
      const colorPriority = { red: 0, yellow: 1, green: 2 };
      const colorA = colorPriority[a.computed_status.signal_color];
      const colorB = colorPriority[b.computed_status.signal_color];
      
      if (colorA !== colorB) {
        return colorA - colorB;
      }

      // 같은 신호색이면 마지막 응답이 오래된 순
      const daysA = a.computed_status.days_since_last_daily || 999;
      const daysB = b.computed_status.days_since_last_daily || 999;
      
      return daysB - daysA;
    });

    // 9. 요약 통계
    const summary = {
      red: dashboardPatients.filter(p => p.computed_status.signal_color === 'red').length,
      yellow: dashboardPatients.filter(p => p.computed_status.signal_color === 'yellow').length,
      green: dashboardPatients.filter(p => p.computed_status.signal_color === 'green').length,
      active: dashboardPatients.filter(p => p.status === 'active').length,
      paused: dashboardPatients.filter(p => p.status === 'paused').length,
      discharged: dashboardPatients.filter(p => p.status === 'discharged').length,
    };

    return NextResponse.json({
      clinic_id: clinicId,
      patients: filteredPatients,
      total: filteredPatients.length,
      summary,
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
