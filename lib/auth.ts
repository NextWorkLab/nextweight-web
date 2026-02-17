// lib/auth.ts
// 간단한 토큰 기반 인증 (MVP용)

import { NextRequest } from "next/server";

export interface AuthResult {
  authenticated: boolean;
  clinic_id?: string;
  error?: string;
}

/**
 * 요청 인증
 * - clinic_id: 기본은 path param(requiredClinicId) 사용
 * - token: header(x-clinic-token) > Authorization Bearer > query(token)
 */
export function authenticateRequest(request: NextRequest, requiredClinicId?: string): AuthResult {
  const authMode = process.env.AUTH_MODE || "token";

  if (authMode === "token") {
    return authenticateWithToken(request, requiredClinicId);
  }

  return {
    authenticated: false,
    error: "Unsupported auth mode",
  };
}

function readToken(request: NextRequest): string | null {
  // 1) x-clinic-token
  const headerToken = request.headers.get("x-clinic-token");
  if (headerToken && headerToken.trim()) return headerToken.trim();

  // 2) Authorization: Bearer xxx
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const t = authHeader.substring(7).trim();
    if (t) return t;
  }

  // 3) query: token
  const { searchParams } = new URL(request.url);
  const qt = searchParams.get("token");
  if (qt && qt.trim()) return qt.trim();

  return null;
}

function readClinicId(request: NextRequest, requiredClinicId?: string): string | null {
  if (requiredClinicId && String(requiredClinicId).trim()) return String(requiredClinicId).trim();

  // fallback: query clinic_id (이전 구현 호환)
  const { searchParams } = new URL(request.url);
  const qid = searchParams.get("clinic_id");
  if (qid && qid.trim()) return qid.trim();

  return null;
}

function authenticateWithToken(request: NextRequest, requiredClinicId?: string): AuthResult {
  const token = readToken(request);
  const clinicId = readClinicId(request, requiredClinicId);

  if (!token || !clinicId) {
    return {
      authenticated: false,
      error: "Missing token or clinic_id",
    };
  }

  const tokenMapJson = process.env.CLINIC_TOKEN_MAP;
  if (!tokenMapJson) {
    return {
      authenticated: false,
      error: "Token map not configured",
    };
  }

  let tokenMap: Record<string, string>;
  try {
    tokenMap = JSON.parse(tokenMapJson);
  } catch {
    return {
      authenticated: false,
      error: "Invalid token map configuration",
    };
  }

  const expectedToken = tokenMap[clinicId];
  if (!expectedToken || expectedToken !== token) {
    return {
      authenticated: false,
      error: "Invalid token for clinic",
    };
  }

  return {
    authenticated: true,
    clinic_id: clinicId,
  };
}

export function unauthorizedResponse(error: string = "Unauthorized") {
  return new Response(JSON.stringify({ error }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * 기존 코드 호환용 별칭
 * dashboard route.ts가 unauthorized를 import 중이어서 그대로 살립니다.
 */
export const unauthorized = unauthorizedResponse;

/**
 * 서버 컴포넌트용 인증 (쿠키 기반)
 * MVP에서는 URL/헤더 토큰 방식 권장
 */
export function getClinicIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const clinicCookie = cookies.find((c) => c.startsWith("clinic_id="));

  if (!clinicCookie) return null;

  return clinicCookie.split("=")[1];
}
