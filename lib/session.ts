// lib/session.ts
// 세션 및 OTP 관리 (server-only, Node.js crypto 사용)

import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "nw_session";
const SESSION_DURATION_DAYS = 30;

// 개발 환경에서 환경변수가 없으면 폴백 시크릿을 사용하고 경고만 출력
function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[NextWeight] SESSION_SECRET not set — using insecure dev fallback. Set it in .env.local for real sessions.");
      return "dev-session-secret-not-for-production-00000";
    }
    throw new Error("Missing SESSION_SECRET env var");
  }
  return s;
}

function getOtpSecret(): string {
  const s = process.env.OTP_SECRET;
  if (!s) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[NextWeight] OTP_SECRET not set — using insecure dev fallback. Set it in .env.local for real OTP.");
      return "dev-otp-secret-not-for-production-000000";
    }
    throw new Error("Missing OTP_SECRET env var");
  }
  return s;
}

// ── 세션 쿠키 ─────────────────────────────────────────────────

export interface SessionPayload {
  user_id: string;
  phone: string;
}

function b64url(s: string): string {
  return Buffer.from(s).toString("base64url");
}

function fromB64url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

function hmacSign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionCookie(payload: SessionPayload): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_DAYS * 86400;
  const data = b64url(JSON.stringify({ ...payload, exp }));
  const sig = hmacSign(data, getSecret());
  return `${data}.${sig}`;
}

export function verifySessionCookie(value: string): SessionPayload | null {
  try {
    const dot = value.lastIndexOf(".");
    if (dot < 0) return null;
    const data = value.slice(0, dot);
    const sig = value.slice(dot + 1);
    const expected = hmacSign(data, getSecret());

    // Timing-safe compare
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    const payload = JSON.parse(fromB64url(data)) as SessionPayload & { exp: number };
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { user_id: payload.user_id, phone: payload.phone };
  } catch {
    return null;
  }
}

export function makeSetCookieHeader(value: string, clear = false): string {
  if (clear) {
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }
  const maxAge = SESSION_DURATION_DAYS * 86400;
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function getSessionFromRequest(request: Request): SessionPayload | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  return verifySessionCookie(decodeURIComponent(match[1]));
}

export { SESSION_COOKIE };

// ── OTP ───────────────────────────────────────────────────────
// HMAC-based time-windowed OTP (no server-side storage needed)
// 창: 5분(300초) 단위 → 현재 + 이전 창 허용

const OTP_WINDOW_SECONDS = 300;
const OTP_DIGITS = 6;

function otpForWindow(phone: string, window: number): string {
  const raw = hmacSign(`${phone}:${window}`, getOtpSecret());
  // raw는 base64url → 숫자만 추출
  const num = parseInt(raw.replace(/[^0-9]/g, "").slice(0, 10) || "0", 10);
  return String(num % 10 ** OTP_DIGITS).padStart(OTP_DIGITS, "0");
}

export function generateOtp(phone: string): string {
  const window = Math.floor(Date.now() / 1000 / OTP_WINDOW_SECONDS);
  return otpForWindow(phone, window);
}

export function verifyOtp(phone: string, code: string): boolean {
  // Mock mode: 개발 환경에서 MOCK_OTP 환경변수가 설정되어 있으면 해당 코드 허용
  const mockOtp = process.env.MOCK_OTP;
  if (mockOtp && code === mockOtp) return true;

  const window = Math.floor(Date.now() / 1000 / OTP_WINDOW_SECONDS);
  const valid = [window, window - 1].map((w) => otpForWindow(phone, w));
  return valid.includes(code);
}
