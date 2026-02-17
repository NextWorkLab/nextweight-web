import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { fetchAll, tables } from "@/lib/airtable";

function s(v: any) {
  return String(v ?? "").trim();
}
function upper(v: any) {
  return s(v).toUpperCase();
}

function normalizeWeeklyDay(v: any) {
  const x = upper(v);
  const allowed = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  return (allowed.includes(x) ? x : "MON") as any;
}

function normalizeStatus(v: any) {
  const x = s(v).toLowerCase();
  if (x === "active" || x === "paused" || x === "discharged") return x as any;
  if (s(v) === "활성") return "active";
  if (s(v) === "중단") return "paused";
  if (s(v) === "종료") return "discharged";
  return "active";
}

function toBool(v: any) {
  if (typeof v === "boolean") return v;
  const x = s(v).toLowerCase();
  return x === "true" || x === "yes" || x === "y" || x === "1" || x === "예";
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
  context: { params: Promise<{ clinic_id: string }> }
) {
  try {
    const { clinic_id } = await context.params;

    const authResult = authenticateRequest(request, clinic_id);
    if (!authResult.authenticated) {
      return unauthorizedResponse(authResult.error);
    }

    // MVP: 전체 로드 후 clinic 매칭(스키마 혼재 방어)
    const allPatients = await fetchAll<any>(tables.Patients);

    const patients = allPatients
      .filter((p: any) => inClinicByFallback(p, clinic_id))
      .map((p: any) => ({
        // 기존 types.Patient에 맞춤
        patient_id: s(p.patient_id) || s(p.id),
        clinic_id: s(p.clinic_id) || clinic_id,
        patient_code: s(p.patient_code),
        phone: s(p.phone),
        name_or_initial: s(p.name_or_initial),
        weekly_day: normalizeWeeklyDay(p.weekly_day),
        consent: toBool(p.consent),
        status: normalizeStatus(p.status ?? p.Status ?? p.Select ?? p["상태"]),
        created_at: s(p.created_at) || s(p.createdTime) || "",
        updated_at: s(p.updated_at) || s(p.updatedTime) || "",
        last_daily_response_at: p.last_daily_response_at || undefined,
        last_weekly_response_at: p.last_weekly_response_at || undefined,
      }))
      .filter((p: any) => p.patient_code);

    return NextResponse.json({ clinic_id, patients });
  } catch (error: any) {
    console.error("Patients list API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
