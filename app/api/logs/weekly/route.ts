// app/api/logs/weekly/route.ts
// 주간 기록 저장

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createWeeklyLog } from "@/lib/patient-airtable";

const VALID_APPETITE = ["감소", "유지", "증가"];
const VALID_EXERCISE = ["없음", "주1회", "주2-3회", "주4회이상"];

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { weight_kg, appetite_change, exercise_frequency } = body;

    const weight = Number(weight_kg);
    if (!weight_kg || isNaN(weight) || weight < 20 || weight > 400) {
      return NextResponse.json({ error: "체중 값이 올바르지 않습니다." }, { status: 400 });
    }

    const appetite = VALID_APPETITE.includes(appetite_change) ? appetite_change : "유지";
    const exercise = VALID_EXERCISE.includes(exercise_frequency) ? exercise_frequency : "없음";

    const log = await createWeeklyLog(session.user_id, {
      weight_kg: weight,
      appetite_change: appetite,
      exercise_frequency: exercise,
    });

    return NextResponse.json({ ok: true, log });
  } catch (err) {
    console.error("weekly log error:", err);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
}
