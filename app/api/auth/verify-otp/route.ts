// app/api/auth/verify-otp/route.ts
// OTP 검증 및 세션 발급

import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, createSessionCookie, makeSetCookieHeader } from "@/lib/session";
import { upsertUser } from "@/lib/patient-airtable";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 10 || digits.length > 11) return null;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone || "");
    const code = String(body.code || "").trim();

    if (!phone) {
      return NextResponse.json({ error: "올바른 휴대폰 번호입니다." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "6자리 인증번호를 입력해 주세요." }, { status: 400 });
    }

    if (!verifyOtp(phone, code)) {
      return NextResponse.json({ error: "인증번호가 올바르지 않거나 만료되었습니다." }, { status: 401 });
    }

    // 사용자 생성 또는 조회
    const user = await upsertUser(phone);

    // 세션 쿠키 발급
    const cookieValue = createSessionCookie({ user_id: user.user_id, phone });
    const setCookie = makeSetCookieHeader(cookieValue);

    return NextResponse.json(
      { ok: true, user_id: user.user_id },
      { headers: { "Set-Cookie": setCookie } }
    );
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
