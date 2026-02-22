// app/api/user/me/route.ts
// 현재 로그인된 사용자 정보 조회

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { findUserById } from "@/lib/patient-airtable";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const user = await findUserById(session.user_id);
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ user_id: user.user_id, email: user.email, consent: user.consent });
  } catch (err) {
    console.error("me error:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
