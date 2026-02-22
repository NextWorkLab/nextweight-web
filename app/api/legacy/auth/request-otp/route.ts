// app/api/legacy/auth/request-otp/route.ts
// [LEGACY] SMS OTP 기반 인증 — 이메일 매직링크로 전환됨
// 이 엔드포인트는 더 이상 사용되지 않습니다.
// 새 엔드포인트: POST /api/auth/request-link

export async function POST() {
  return Response.json(
    {
      error: "이 인증 방식은 더 이상 지원되지 않습니다. 이메일 로그인을 이용해 주세요.",
      deprecated: true,
      replacement: "/api/auth/request-link",
    },
    { status: 410 }
  );
}
