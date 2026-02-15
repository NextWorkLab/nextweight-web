// lib/types.ts
// 병원용 GLP-1 질관리 리포트 서비스 타입 정의

export interface Clinic {
  clinic_id: string;
  clinic_name: string;
  registration_form_url: string;
  daily_form_url: string;
  weekly_form_url: string;
  report_weeks: number; // 기본 4주
  active: boolean;
}

export interface Patient {
  patient_id: string;
  clinic_id: string;
  patient_code: string; // 예: C001-4827
  phone: string;
  name_or_initial: string;
  weekly_day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  consent: boolean;
  status: 'active' | 'paused' | 'discharged';
  created_at: string;
  updated_at: string;
  last_daily_response_at?: string;
  last_weekly_response_at?: string;
}

export interface DailyResponse {
  timestamp: string;
  patient_code: string;
  medication_taken: boolean; // 오늘 투약했나요?
  nausea_level: number; // 오심 정도 (0-10)
  vomiting: boolean; // 구토 여부
  dizziness: boolean; // 어지럼증 여부
  abdominal_discomfort: boolean; // 복부 불편감
  overall_condition: number; // 전반적 컨디션 (0-10)
}

export interface WeeklyResponse {
  timestamp: string;
  patient_code: string;
  weight_kg: number;
  body_fat_percent?: number;
  appetite_change: string; // 식욕/포만감 변화
  meal_amount_change: string; // 식사량 변화
  exercise_frequency: string; // 운동 빈도
}

export type SignalColor = 'red' | 'yellow' | 'green';

export interface ComputedStatus {
  patient_code: string;
  signal_color: SignalColor;
  signal_reasons: string[]; // 신호색 트리거 요약
  adherence_rate_7d: number; // 7일 투약 순응률 (0-100)
  max_nausea_7d: number; // 7일간 최대 오심
  vomiting_count_7d: number; // 7일간 구토 횟수
  missed_medication_7d: number; // 7일간 투약 누락 횟수
  last_daily_date?: string;
  last_weekly_date?: string;
  days_since_last_daily?: number;
  days_since_last_weekly?: number;
}

export interface DashboardPatient extends Patient {
  computed_status: ComputedStatus;
}

export interface ReportData {
  patient: Patient;
  computed_status: ComputedStatus;
  daily_responses: DailyResponse[];
  weekly_responses: WeeklyResponse[];
  period_weeks: number;
  period_start_date: string;
  period_end_date: string;
  
  // 차트용 데이터
  daily_chart_data: {
    date: string;
    medication_taken: boolean;
    nausea_level: number;
    overall_condition: number;
  }[];
  
  weekly_chart_data: {
    date: string;
    weight_kg: number;
    body_fat_percent?: number;
  }[];
  
  // 요약 통계
  summary: {
    total_daily_responses: number;
    total_weekly_responses: number;
    adherence_rate: number;
    avg_nausea: number;
    avg_condition: number;
    weight_change?: number; // kg
    weight_change_percent?: number; // %
  };
}

export interface AuthToken {
  clinic_id: string;
  token: string;
}

// Google Sheets 응답 원본 타입 (폼에서 들어오는 그대로)
export interface RegistrationFormResponse {
  Timestamp: string;
  '휴대폰 번호': string;
  '이름 또는 이니셜': string;
  '생년월일 또는 연령대'?: string;
  'GLP-1 시작일'?: string;
  '설문 수신 동의': string;
  '주간 설문 발송 요일'?: string;
}

export interface DailyFormResponse {
  Timestamp: string;
  '환자코드': string;
  '오늘 투약했나요?': string;
  '오심 정도 (0-10)': string;
  '구토 여부': string;
  '어지럼증 여부': string;
  '복부 불편감': string;
  '오늘 전반적 컨디션 (0-10)': string;
}

export interface WeeklyFormResponse {
  Timestamp: string;
  '환자코드': string;
  '체중(kg)': string;
  '체지방률(%)': string;
  '식욕/포만감 변화': string;
  '식사량 변화': string;
  '운동 빈도': string;
}
