// lib/magic-link.ts
// 매직링크 토큰 및 인증 코드 생성·해시 유틸리티 (server-only)

import { randomBytes, createHash, timingSafeEqual } from "crypto";

/** 64-char hex URL-safe token (32 random bytes) */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** 6자리 숫자 인증 코드 */
export function generateCode(): string {
  // 3바이트(0~16,777,215) % 1,000,000 → 0~999,999
  const num = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return String(num).padStart(6, "0");
}

/** SHA-256 해시 (hex) */
export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** 타이밍-세이프 코드 검증 */
export function verifyCode(code: string, storedHash: string): boolean {
  const incoming = Buffer.from(hashCode(code), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (incoming.length !== stored.length) return false;
  return timingSafeEqual(incoming, stored);
}
