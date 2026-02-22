// app/api/share/route.ts
// 공유 토큰 생성 및 목록 조회

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createShareToken, listShareTokens } from "@/lib/patient-airtable";

// 공유 토큰 생성
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    // 만료 시간 (분): 10분 또는 1440분(24시간)
    const minutes = body.expires_minutes === 1440 ? 1440 : 10;
    const token = await createShareToken(session.user_id, minutes);
    return NextResponse.json({ token });
  } catch (err) {
    console.error("share create error:", err);
    return NextResponse.json({ error: "공유 토큰 생성에 실패했습니다." }, { status: 500 });
  }
}

// 공유 토큰 목록
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const tokens = await listShareTokens(session.user_id);
    return NextResponse.json({ tokens });
  } catch (err) {
    console.error("share list error:", err);
    return NextResponse.json({ error: "목록 조회에 실패했습니다." }, { status: 500 });
  }
}
