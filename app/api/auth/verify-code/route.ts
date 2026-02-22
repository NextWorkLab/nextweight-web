// app/api/auth/verify-code/route.ts
// POST /api/auth/verify-code — 6자리 인증 코드 검증 및 세션 발급

import { verifyCode } from "@/lib/magic-link";
import { createSessionCookie, makeSetCookieHeader } from "@/lib/session";
import {
  findUserByEmail,
  findLatestMagicLinkByUserId,
  markMagicLinkUsed,
  incrementMagicLinkAttempts,
} from "@/lib/patient-airtable";

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { email, code } = body as Record<string, unknown>;

  if (
    typeof email !== "string" ||
    typeof code !== "string" ||
    !/^\d{6}$/.test(code)
  ) {
    return Response.json(
      { error: "이메일과 6자리 인증 코드를 입력해 주세요." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 사용자 조회
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return Response.json(
        { error: "인증 정보를 찾을 수 없습니다. 다시 요청해 주세요." },
        { status: 401 }
      );
    }

    // 최신 유효 매직링크 조회
    const magicLink = await findLatestMagicLinkByUserId(user.user_id);
    if (!magicLink) {
      return Response.json(
        { error: "인증 코드가 존재하지 않습니다. 새 코드를 요청해 주세요." },
        { status: 401 }
      );
    }

    // 최대 시도 횟수 초과
    if (magicLink.attempts >= MAX_ATTEMPTS) {
      return Response.json(
        { error: "최대 시도 횟수(5회)를 초과했습니다. 새 인증 코드를 요청해 주세요." },
        { status: 429 }
      );
    }

    // 만료 확인
    if (new Date(magicLink.expires_at) < new Date()) {
      return Response.json(
        { error: "인증 코드가 만료되었습니다. 새 코드를 요청해 주세요." },
        { status: 401 }
      );
    }

    // 코드 검증
    if (!verifyCode(code, magicLink.code_hash)) {
      await incrementMagicLinkAttempts(magicLink.id, magicLink.attempts + 1);
      const remaining = MAX_ATTEMPTS - (magicLink.attempts + 1);
      return Response.json(
        {
          error:
            remaining > 0
              ? `인증 코드가 올바르지 않습니다. (남은 시도: ${remaining}회)`
              : "인증 코드가 올바르지 않습니다. 새 코드를 요청해 주세요.",
        },
        { status: 401 }
      );
    }

    // 사용 처리
    await markMagicLinkUsed(magicLink.id);

    // 세션 쿠키 발급
    const sessionValue = createSessionCookie({
      user_id: user.user_id,
      email: user.email,
    });

    return new Response(JSON.stringify({ ok: true, user_id: user.user_id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": makeSetCookieHeader(sessionValue),
      },
    });
  } catch (err) {
    console.error("[verify-code] error:", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
