// app/api/auth/request-otp/route.ts
// OTP 발송 요청

import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/session";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 10 || digits.length > 11) return null;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone || "");
    if (!phone) {
      return NextResponse.json({ error: "올바른 휴대폰 번호를 입력해 주세요." }, { status: 400 });
    }

    const code = generateOtp(phone);

    // SMS 발송 (현재는 stub — 실제 SMS API로 교체 필요)
    // await smsClient.send({ to: phone, message: `[NextWeight] 인증번호: ${code}` });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] OTP for ${phone}: ${code}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("request-otp error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
