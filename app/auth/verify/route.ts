// app/auth/verify/route.ts
// GET /auth/verify?token=... — 매직링크 클릭 처리 Route Handler
// 쿠키 설정이 필요하므로 Page가 아닌 Route Handler로 구현

import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/session";
import {
  findMagicLinkByToken,
  markMagicLinkUsed,
  findUserById,
} from "@/lib/patient-airtable";

const BASE_URL =
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

function redirect(path: string, res?: NextResponse) {
  const url = new URL(path, BASE_URL);
  const r = NextResponse.redirect(url);
  if (res) {
    res.cookies.getAll().forEach((c) => r.cookies.set(c.name, c.value));
  }
  return r;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return redirect("/auth?error=invalid");
  }

  try {
    const magicLink = await findMagicLinkByToken(token);

    if (!magicLink) {
      return redirect("/auth?error=invalid");
    }

    if (magicLink.used_at) {
      return redirect("/auth?error=used");
    }

    if (magicLink.revoked_at) {
      return redirect("/auth?error=revoked");
    }

    if (new Date(magicLink.expires_at) < new Date()) {
      return redirect("/auth?error=expired");
    }

    // 사용 처리
    await markMagicLinkUsed(magicLink.id);

    // 사용자 조회
    const user = await findUserById(magicLink.user_id);
    if (!user) {
      return redirect("/auth?error=invalid");
    }

    // 세션 쿠키 설정 후 /app 리디렉션
    const sessionValue = createSessionCookie({
      user_id: user.user_id,
      email: user.email,
    });

    const response = NextResponse.redirect(new URL("/app", BASE_URL));
    response.cookies.set("nw_session", sessionValue, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("[verify-token] error:", err);
    return redirect("/auth?error=server");
  }
}
