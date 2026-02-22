// app/api/share/[token]/route.ts
// 공유 토큰 검증 및 리포트 데이터 반환 / 토큰 취소

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { findShareToken, revokeShareToken, getDailyLogs, getWeeklyLogs } from "@/lib/patient-airtable";
import { generatePatientReport } from "@/lib/patient-report-engine";

// 공유 토큰으로 리포트 데이터 조회 (인증 불필요 — 공개 읽기)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const shareToken = await findShareToken(token);
    if (!shareToken) {
      return NextResponse.json({ error: "유효하지 않은 공유 링크입니다." }, { status: 404 });
    }
    if (shareToken.revoked_at) {
      return NextResponse.json({ error: "취소된 공유 링크입니다." }, { status: 410 });
    }
    if (new Date(shareToken.expires_at) < new Date()) {
      return NextResponse.json({ error: "만료된 공유 링크입니다." }, { status: 410 });
    }

    const [dailyLogs, weeklyLogs] = await Promise.all([
      getDailyLogs(shareToken.user_id, 30),
      getWeeklyLogs(shareToken.user_id, 30),
    ]);

    const report = generatePatientReport(shareToken.user_id, dailyLogs, weeklyLogs, 14);
    return NextResponse.json({ report, expires_at: shareToken.expires_at });
  } catch (err) {
    console.error("share get error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 공유 토큰 취소 (인증 필요)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { token } = await params;
  try {
    const shareToken = await findShareToken(token);
    if (!shareToken) {
      return NextResponse.json({ error: "토큰을 찾을 수 없습니다." }, { status: 404 });
    }
    if (shareToken.user_id !== session.user_id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    await revokeShareToken(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("share revoke error:", err);
    return NextResponse.json({ error: "취소에 실패했습니다." }, { status: 500 });
  }
}
