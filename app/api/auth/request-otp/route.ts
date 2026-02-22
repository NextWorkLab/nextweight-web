// app/api/auth/request-otp/route.ts
// [DEPRECATED] SMS OTP 방식 제거됨 — 이메일 매직링크로 전환
// 클라이언트는 POST /api/auth/request-link 를 사용하세요.

export async function POST() {
  return Response.json(
    {
      error: "SMS 인증은 더 이상 지원되지 않습니다. 이메일 로그인을 이용해 주세요.",
      deprecated: true,
      replacement: "/api/auth/request-link",
    },
    { status: 410 }
  );
}
