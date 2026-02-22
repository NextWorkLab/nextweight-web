// app/api/auth/request-link/route.ts
// POST /api/auth/request-link — 이메일 매직링크 및 인증 코드 발송

import { generateToken, generateCode, hashCode } from "@/lib/magic-link";
import { sendMagicLinkEmail } from "@/lib/email";
import { upsertUserByEmail, createMagicLink } from "@/lib/patient-airtable";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS_PER_HOUR = 5;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const email = typeof (body as Record<string, unknown>).email === "string"
    ? ((body as Record<string, unknown>).email as string).trim().toLowerCase()
    : "";

  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: "유효한 이메일 주소를 입력해 주세요." }, { status: 400 });
  }

  try {
    // 사용자 조회 또는 생성
    const user = await upsertUserByEmail(email);

    // 토큰·코드 생성
    const token = generateToken();
    const code = generateCode();
    const code_hash = hashCode(code);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10분

    // MagicLinks 저장
    await createMagicLink({ token, code_hash, user_id: user.user_id, expires_at });

    // 이메일 발송
    const baseUrl =
      process.env.APP_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    await sendMagicLinkEmail({ to: email, token, code, baseUrl });

    // 개발 모드: 응답에 코드·토큰 포함
    const isDev = process.env.NODE_ENV !== "production";
    return Response.json({
      ok: true,
      ...(isDev && { dev_code: code, dev_token: token }),
    });
  } catch (err) {
    console.error("[request-link] error:", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
