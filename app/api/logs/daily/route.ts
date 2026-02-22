// app/api/logs/daily/route.ts
// 일일 기록 저장

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createDailyLog } from "@/lib/patient-airtable";

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { medication_taken, nausea_level, vomiting, weight_kg } = body;

    if (typeof medication_taken !== "boolean") {
      return NextResponse.json({ error: "복약 여부를 선택해 주세요." }, { status: 400 });
    }
    const level = typeof nausea_level === "number" ? Math.max(0, Math.min(10, nausea_level)) : 0;

    const log = await createDailyLog(session.user_id, {
      medication_taken,
      nausea_level: level,
      vomiting: Boolean(vomiting),
      weight_kg: weight_kg !== undefined && !isNaN(Number(weight_kg)) ? Number(weight_kg) : undefined,
    });

    return NextResponse.json({ ok: true, log });
  } catch (err) {
    console.error("daily log error:", err);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
}
