// app/api/clinics/[clinic_id]/patients/[patient_code]/report/route.ts

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { fetchAll, tables } from "@/lib/airtable";
import { generateReportData } from "@/lib/qi-engine";
import type { Patient, DailyResponse, WeeklyResponse } from "@/lib/types";

function s(v: any) {
  return String(v ?? "").trim();
}
function upper(v: any) {
  return s(v).toUpperCase();
}
function toBool(v: any) {
  if (typeof v === "boolean") return v;
  const x = s(v).toLowerCase();
  return x === "true" || x === "yes" || x === "y" || x === "1" || x === "예";
}
function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeWeeklyDay(v: any): Patient["weekly_day"] {
  const x = upper(v);
  const allowed = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  return (allowed.includes(x) ? x : "MON") as any;
}

function normalizeStatus(v: any): Patient["status"] {
  const x = s(v).toLowerCase();
  if (x === "active" || x === "paused" || x === "discharged") return x as any;
  if (s(v) === "활성") return "active";
  if (s(v) === "중단") return "paused";
  if (s(v) === "종료") return "discharged";
  return "active";
}

function parseIsoDate(v: any): string | null {
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function getStartDateIso(weeks: number) {
  const start = new Date();
  start.setDate(start.getDate() - weeks * 7);
  return start.toISOString();
}

function inClinicByFallback(p: any, clinic_id: string) {
  const c1 = s(p?.clinic_id);
  const c2 = s(p?.clinic);
  if (upper(c1) === upper(clinic_id)) return true;
  if (upper(c2) === upper(clinic_id)) return true;

  const pc = s(p?.patient_code);
  if (pc && upper(pc).startsWith(upper(clinic_id) + "-")) return true;

  return false;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clinic_id: string; patient_code: string }> }
) {
  try {
    const { clinic_id, patient_code } = await context.params;

    // 1) 인증
    const authResult = authenticateRequest(request, clinic_id);
    if (!authResult.authenticated) {
      return unauthorizedResponse(authResult.error);
    }

    // 2) weeks
    const { searchParams } = new URL(request.url);
    const weeks = Math.max(1, Math.min(26, parseInt(searchParams.get("weeks") || "4", 10) || 4));
    const startIso = getStartDateIso(weeks);

    // 3) 환자 조회 (MVP: 전체 Patients 로드 후 code로 찾기)
    const allPatients = await fetchAll<any>(tables.Patients);
    const pRaw = allPatients.find((p: any) => s(p.patient_code) === s(patient_code));

    if (!pRaw) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // 4) clinic 소속 확인
    if (!inClinicByFallback(pRaw, clinic_id)) {
      return unauthorizedResponse("Patient does not belong to this clinic");
    }

    // 5) Patient 타입으로 매핑
    const patient: Patient = {
      patient_id: s(pRaw.patient_id) || s(pRaw.id),
      clinic_id: s(pRaw.clinic_id) || clinic_id,
      patient_code: s(pRaw.patient_code),
      phone: s(pRaw.phone),
      name_or_initial: s(pRaw.name_or_initial),
      weekly_day: normalizeWeeklyDay(pRaw.weekly_day),
      consent: toBool(pRaw.consent),
      status: normalizeStatus(pRaw.status ?? pRaw.Status ?? pRaw.Select ?? pRaw["상태"]),
      created_at: s(pRaw.created_at) || s(pRaw.createdTime) || "",
      updated_at: s(pRaw.updated_at) || "",
      last_daily_response_at: pRaw.last_daily_response_at || undefined,
      last_weekly_response_at: pRaw.last_weekly_response_at || undefined,
    };

    // 6) 응답 로드
    // 스키마가 link(patient)만 있고 patient_code가 없을 수도 있어서:
    // - 우선 전체를 로드한 뒤
    // - patient_code 필드가 있으면 그걸로 필터
    // - 없으면 링크 필드(patient)에 환자 record id가 포함되는지로 필터
    const [allDailyRaw, allWeeklyRaw] = await Promise.all([
      fetchAll<any>(tables.DailyResponses),
      fetchAll<any>(tables.WeeklyResponses),
    ]);

    const patientRecordId = s(pRaw.id);

    const hasLink = (val: any, recId: string) => {
      if (!val) return false;
      const id = s(recId);
      if (Array.isArray(val)) return val.some((v) => s(v) === id);
      return s(val).includes(id);
    };

    const inPeriod = (ts: any) => {
      const iso = parseIsoDate(ts);
      if (!iso) return false;
      return iso >= startIso && iso <= new Date().toISOString();
    };

    const dailyResponses: DailyResponse[] = allDailyRaw
      .filter((r: any) => {
        if (!inPeriod(r.timestamp)) return false;
        const byCode = s(r.patient_code) ? s(r.patient_code) === s(patient_code) : false;
        const byLink = hasLink(r.patient, patientRecordId);
        return byCode || byLink;
      })
      .map((r: any) => ({
        timestamp: parseIsoDate(r.timestamp) || new Date().toISOString(),
        patient_code: s(r.patient_code) || s(patient_code),
        medication_taken: toBool(r.medication_taken === "예" ? true : r.medication_taken),
        nausea_level: toNum(r.nausea_level, 0),
        vomiting: toBool(r.vomiting === "예" ? true : r.vomiting),
        dizziness: toBool(r.dizziness === "예" ? true : r.dizziness),
        abdominal_discomfort: toBool(r.abdominal_discomfort === "예" ? true : r.abdominal_discomfort),
        overall_condition: toNum(r.overall_condition, 0),
      }));

    const weeklyResponses: WeeklyResponse[] = allWeeklyRaw
      .filter((r: any) => {
        if (!inPeriod(r.timestamp)) return false;
        const byCode = s(r.patient_code) ? s(r.patient_code) === s(patient_code) : false;
        const byLink = hasLink(r.patient, patientRecordId);
        return byCode || byLink;
      })
      .map((r: any) => ({
        timestamp: parseIsoDate(r.timestamp) || new Date().toISOString(),
        patient_code: s(r.patient_code) || s(patient_code),
        weight_kg: toNum(r.weight_kg, 0),
        body_fat_percent: r.body_fat_percent !== undefined && r.body_fat_percent !== null ? toNum(r.body_fat_percent) : undefined,
        appetite_change: s(r.appetite_change),
        meal_amount_change: s(r.meal_amount_change),
        exercise_frequency: s(r.exercise_frequency),
      }));

    // 7) 리포트 생성
    const reportData = generateReportData(patient, dailyResponses, weeklyResponses, weeks);
    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error("Patient report API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
