// lib/patient-types.ts
// 환자 중심 플랫폼 타입 정의

export interface PatientUser {
  id: string;           // Airtable record id
  user_id: string;      // UUID
  phone: string;
  email?: string;
  consent: boolean;
  created_at: string;
}

export interface DailyLog {
  id: string;           // Airtable record id
  user_id: string;
  timestamp: string;    // ISO 8601
  medication_taken: boolean;
  nausea_level: number; // 0–10
  vomiting: boolean;
  weight_kg?: number;   // 선택: 매일 측정 시
}

export interface WeeklyLog {
  id: string;
  user_id: string;
  timestamp: string;
  weight_kg: number;
  appetite_change: string; // '감소' | '유지' | '증가'
  exercise_frequency: string; // '없음' | '주1회' | '주2-3회' | '주4회이상'
}

export interface ShareToken {
  id: string;
  token: string;
  user_id: string;
  expires_at: string;   // ISO 8601
  created_at: string;
  revoked_at?: string;
}

export type SignalColor = 'red' | 'yellow' | 'green';

export interface SignalResult {
  color: SignalColor;
  reasons: string[];
}

export interface DailyLogFields {
  user_id?: string;
  timestamp?: string;
  medication_taken?: boolean;
  nausea_level?: number;
  vomiting?: boolean;
  weight_kg?: number;
  [key: string]: unknown;
}

export interface WeeklyLogFields {
  user_id?: string;
  timestamp?: string;
  weight_kg?: number;
  appetite_change?: string;
  exercise_frequency?: string;
  [key: string]: unknown;
}

export interface PatientUserFields {
  user_id?: string;
  phone?: string;
  email?: string;
  consent?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface ShareTokenFields {
  token?: string;
  user_id?: string;
  expires_at?: string;
  created_at?: string;
  revoked_at?: string;
  [key: string]: unknown;
}

// 리포트 기간 선택
export type ReportPeriod = 14 | 30;

export interface PatientReport {
  user_id: string;
  period_days: ReportPeriod;
  period_start: string;
  period_end: string;
  daily_logs: DailyLog[];
  weekly_logs: WeeklyLog[];
  signal: SignalResult;
  stats: {
    total_days: number;
    records_count: number;
    adherence_rate: number;      // 복약 순응률 (%)
    avg_nausea: number;
    max_nausea: number;
    vomiting_count: number;
    missed_medication: number;
    weight_start?: number;
    weight_latest?: number;
    weight_change?: number;
  };
  chart_data: {
    date: string;
    nausea_level?: number;
    medication_taken?: boolean;
    weight_kg?: number;
    vomiting?: boolean;
  }[];
}
