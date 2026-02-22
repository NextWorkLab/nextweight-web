// middleware.ts
// /app/* 경로 보호: 세션 없으면 /auth로 리디렉션

import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "nw_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /app/* 이하 경로만 보호
  if (!pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 세션 서명 검증은 API route / server component에서 수행
  // middleware는 쿠키 존재 여부만 확인 (서버 secret 접근 불가)
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
