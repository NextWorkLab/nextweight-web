// lib/sheets.ts
// Google Sheets API 연동 (서버 전용) - googleapis 사용

import { google } from 'googleapis';
import type {
  Clinic,
  Patient,
  DailyResponse,
  WeeklyResponse,
  DailyFormResponse,
  WeeklyFormResponse
} from './types';

// Google Sheets API 클라이언트 초기화
function getGoogleSheetsClient() {
  // Vercel / .env.local 키 이름과 동일하게 맞춤
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets service account credentials not configured');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

// 시트에서 모든 데이터 읽기
export async function readAll(tabName: string): Promise<any[][] | null> {
  try {
    // Vercel / .env.local 키 이름과 동일하게 맞춤
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      console.error('GOOGLE_SHEET_ID not configured');
      return null;
    }

    const sheets = getGoogleSheetsClient();
    const range = `${tabName}!A:Z`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values || null;
  } catch (error) {
    console.error(`Error reading sheet ${tabName}:`, error);
    return null;
  }
}

// 특정 범위 읽기
export async function readRange(tabName: string, rangeA1: string): Promise<any[][] | null> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      console.error('GOOGLE_SHEET_ID not configured');
      return null;
    }

    const sheets = getGoogleSheetsClient();
    const range = `${tabName}!${rangeA1}`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values || null;
  } catch (error) {
    console.error(`Error reading range ${tabName}!${rangeA1}:`, error);
    return null;
  }
}

// 헤더와 데이터를 객체 배열로 변환
function parseSheetData<T>(rows: any[][]): T[] {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index] : '';
    });
    return obj as T;
  });
}

// Clinic 데이터 읽기
export async function findAllClinics(): Promise<Clinic[]> {
  const rows = await readAll('Clinics');
  if (!rows) return [];

  const data = parseSheetData<any>(rows);

  return data
    .map(row => ({
      clinic_id: row.clinic_id || '',
      clinic_name: row.clinic_name || '',
      registration_form_url: row.registration_form_url || '',
      daily_form_url: row.daily_form_url || '',
      weekly_form_url: row.weekly_form_url || '',
      report_weeks: parseInt(row.report_weeks) || 4,
      active: row.active === 'TRUE' || row.active === true,
    }))
    .filter(c => c.clinic_id); // 빈 행 제거
}

// 특정 Clinic 찾기
export async function findClinicById(clinic_id: string): Promise<Clinic | null> {
  const clinics = await findAllClinics();
  return clinics.find(c => c.clinic_id === clinic_id) || null;
}

// Clinic의 모든 환자 읽기
export async function findPatientsByClinic(clinic_id: string): Promise<Patient[]> {
  const rows = await readAll('Patients');
  if (!rows) return [];

  const data = parseSheetData<any>(rows);

  return data
    .filter(row => row.clinic_id === clinic_id)
    .map(row => ({
      patient_id: row.patient_id || '',
      clinic_id: row.clinic_id || '',
      patient_code: row.patient_code || '',
      phone: row.phone || '',
      name_or_initial: row.name_or_initial || '',
      weekly_day: (row.weekly_day || 'MON') as any,
      consent: row.consent === 'TRUE' || row.consent === true,
      status: (row.status || 'active') as any,
      created_at: row.created_at || '',
      updated_at: row.updated_at || '',
      last_daily_response_at: row.last_daily_response_at || undefined,
      last_weekly_response_at: row.last_weekly_response_at || undefined,
    }))
    .filter(p => p.patient_code); // 빈 행 제거
}

export async function findPatientByCode(patient_code: string): Promise<Patient | null> {
  const rows = await readAll('Patients');
  if (!rows) return null;

  const data = parseSheetData<any>(rows);

  const row = data.find(
    r => String(r.patient_code).trim() === String(patient_code).trim()
  );

  if (!row) return null;

  return {
    patient_id: row.patient_id || '',
    clinic_id: row.clinic_id || '',
    patient_code: row.patient_code || '',
    phone: row.phone || '',
    name_or_initial: row.name_or_initial || '',
    weekly_day: (row.weekly_day || 'MON') as any,
    consent: row.consent === 'TRUE' || row.consent === true,
    status: (row.status || 'active') as any,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    last_daily_response_at: row.last_daily_response_at || undefined,
    last_weekly_response_at: row.last_weekly_response_at || undefined,
  };
}

// Daily 응답 읽기 (특정 환자코드들, 특정 날짜 이후)
export async function findDailyResponses(
  patientCodes: string[],
  sinceDate?: Date
): Promise<DailyResponse[]> {
  const rows = await readAll('DailyResponses');
  if (!rows) return [];

  const formData = parseSheetData<DailyFormResponse>(rows);

  return formData
    .filter(row => {
      const code = row['환자코드'];
      if (!code || !patientCodes.includes(code)) return false;

      if (sinceDate && row.Timestamp) {
        const timestamp = new Date(row.Timestamp);
        if (isNaN(timestamp.getTime()) || timestamp < sinceDate) return false;
      }

      return true;
    })
    .map(row => ({
      timestamp: row.Timestamp || new Date().toISOString(),
      patient_code: row['환자코드'],
      medication_taken: parseYesNo(row['오늘 투약했나요?']),
      nausea_level: parseNumberRequired(row['오심 정도 (0-10)'], 0),
      vomiting: parseYesNo(row['구토 여부']),
      dizziness: parseYesNo(row['어지럼증 여부']),
      abdominal_discomfort: parseYesNo(row['복부 불편감']),
      overall_condition: parseNumberRequired(row['오늘 전반적 컨디션 (0-10)'], 0),
    }));
}

// Weekly 응답 읽기
export async function findWeeklyResponses(
  patientCodes: string[],
  sinceDate?: Date
): Promise<WeeklyResponse[]> {
  const rows = await readAll('WeeklyResponses');
  if (!rows) return [];

  const formData = parseSheetData<WeeklyFormResponse>(rows);

  return formData
    .filter(row => {
      const code = row['환자코드'];
      if (!code || !patientCodes.includes(code)) return false;

      if (sinceDate && row.Timestamp) {
        const timestamp = new Date(row.Timestamp);
        if (isNaN(timestamp.getTime()) || timestamp < sinceDate) return false;
      }

      return true;
    })
    .map(row => ({
      timestamp: row.Timestamp || new Date().toISOString(),
      patient_code: row['환자코드'],
      weight_kg: parseNumberRequired(row['체중(kg)'], 0),
      body_fat_percent: parseNumberOptional(row['체지방률(%)']),
      appetite_change: row['식욕/포만감 변화'] || '',
      meal_amount_change: row['식사량 변화'] || '',
      exercise_frequency: row['운동 빈도'] || '',
    }));
}

// 유틸리티 함수들
function parseYesNo(value: unknown): boolean {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;

  const v = String(value).trim().toLowerCase();
  return v === '예' || v === 'yes' || v === 'y' || v === '네' || v === 'true' || v === 'o';
}

// number 필수인 필드용: 항상 number 반환
function parseNumberRequired(value: unknown, fallback: number): number {
  if (value === '' || value === null || value === undefined) return fallback;

  let strValue = String(value);
  strValue = strValue.replace(/[^0-9.-]/g, '');

  const num = parseFloat(strValue);
  return isNaN(num) ? fallback : num;
}

// 선택 필드용: 없으면 undefined
function parseNumberOptional(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;

  let strValue = String(value);
  strValue = strValue.replace(/[^0-9.-]/g, '');

  const num = parseFloat(strValue);
  return isNaN(num) ? undefined : num;
}

// 날짜 범위 계산 (Asia/Seoul 기준)
export function getDateRange(weeks: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (weeks * 7));

  return { start, end };
}
