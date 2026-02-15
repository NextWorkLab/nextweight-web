import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, unauthorizedResponse } from "@/lib/auth";
import { readAll } from "@/lib/sheets";

function toObjects(rows: any[][]) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => String(h || "").trim());
  return rows.slice(1).map(r => {
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = r?.[i];
    });
    return obj;
  });
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

    const rows = await readAll("Patients");
    const data = toObjects(rows as any[][]);

    const patients = data
      .filter((r: any) => String(r.clinic_id || "").trim() === String(clinic_id).trim())
      .map((r: any) => ({
        patient_id: r.patient_id || "",
        clinic_id: r.clinic_id || "",
        patient_code: r.patient_code || "",
        phone: r.phone || "",
        name_or_initial: r.name_or_initial || "",
        weekly_day: r.weekly_day || "MON",
        consent: r.consent === "TRUE" || r.consent === true,
        status: r.status || "active",
        created_at: r.created_at || "",
        updated_at: r.updated_at || "",
        last_daily_response_at: r.last_daily_response_at || undefined,
        last_weekly_response_at: r.last_weekly_response_at || undefined,
      }))
      .filter((p: any) => p.patient_code);

    return NextResponse.json({ clinic_id, patients });
  } catch (error) {
    console.error("Patients list API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
