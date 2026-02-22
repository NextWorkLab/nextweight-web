// app/api/report/route.ts
// 환자 리포트 생성 API

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { getDailyLogs, getWeeklyLogs } from "@/lib/patient-airtable";
import { generatePatientReport } from "@/lib/patient-report-engine";
import type { ReportPeriod } from "@/lib/patient-types";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawDays = parseInt(searchParams.get("days") || "14", 10);
  const days: ReportPeriod = rawDays === 30 ? 30 : 14;

  try {
    const [dailyLogs, weeklyLogs] = await Promise.all([
      getDailyLogs(session.user_id, days),
      getWeeklyLogs(session.user_id, days),
    ]);

    const report = generatePatientReport(session.user_id, dailyLogs, weeklyLogs, days);
    return NextResponse.json(report);
  } catch (err) {
    console.error("report error:", err);
    return NextResponse.json({ error: "리포트 생성에 실패했습니다." }, { status: 500 });
  }
}
