// app/api/clinics/[clinic_id]/patients/[patient_code]/report/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/auth';
import {
  findPatientByCode,
  findDailyResponses,
  findWeeklyResponses,
  getDateRange,
} from '@/lib/sheets';
import { generateReportData } from '@/lib/qi-engine';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clinic_id: string; patient_code: string }> }
) {
  try {
    const { clinic_id, patient_code } = await context.params;

    // 1. 인증 확인
    const authResult = authenticateRequest(request, clinic_id);
    if (!authResult.authenticated) {
      return unauthorizedResponse(authResult.error);
    }

    // 2. 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') || '4', 10);

    // 3. 환자 정보 조회
    const patient = await findPatientByCode(patient_code);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // 4. clinic_id 일치 확인 (보안)
    if (patient.clinic_id !== clinic_id) {
      return unauthorizedResponse('Patient does not belong to this clinic');
    }

    // 5. 응답 데이터 조회
    const { start } = getDateRange(weeks);

    const [dailyResponses, weeklyResponses] = await Promise.all([
      findDailyResponses([patient_code], start),
      findWeeklyResponses([patient_code], start),
    ]);

    // 6. 리포트 데이터 생성
    const reportData = generateReportData(
      patient,
      dailyResponses,
      weeklyResponses,
      weeks
    );

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Patient report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

