"use client";

// app/auth/page.tsx
// 이메일 매직링크 + 인증 코드 로그인 페이지

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ── 에러 메시지 매핑 ───────────────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  expired: "링크가 만료되었습니다. 다시 로그인을 요청해 주세요.",
  used: "이미 사용된 링크입니다. 다시 로그인을 요청해 주세요.",
  revoked: "유효하지 않은 링크입니다. 다시 로그인을 요청해 주세요.",
  invalid: "유효하지 않은 링크입니다. 다시 로그인을 요청해 주세요.",
  server: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/app";
  const errorParam = searchParams.get("error");

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? (ERROR_MESSAGES[errorParam] ?? "오류가 발생했습니다.") : null
  );
  const [info, setInfo] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // URL error 파라미터 제거 (뒤로가기 오염 방지)
  useEffect(() => {
    if (errorParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [errorParam]);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류가 발생했습니다.");

      // 개발 모드: 코드 자동 입력
      if (data.dev_code) {
        setCode(String(data.dev_code));
        setInfo(`[개발] 인증 코드: ${data.dev_code}`);
      } else {
        setInfo(null);
      }

      setStep("code");
      setTimeout(() => codeRef.current?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError("6자리 인증 코드를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "인증에 실패했습니다.");
      router.push(nextPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "인증에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            <span className="text-blue-600">Next</span>Weight
          </h1>
          <p className="mt-1 text-sm text-slate-500">환자 자가관리 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

          {/* ── Step 1: 이메일 입력 ── */}
          {step === "email" ? (
            <>
              <h2 className="text-base font-semibold text-slate-800 mb-1">
                이메일로 로그인
              </h2>
              <p className="text-sm text-slate-500 mb-5">
                로그인 링크와 인증 코드를 이메일로 보내드립니다.
              </p>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={requestLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    이메일 주소
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {loading ? "발송 중..." : "인증 코드 받기"}
                </button>
              </form>
            </>
          ) : (
            /* ── Step 2: 코드 입력 ── */
            <>
              <button
                onClick={() => { setStep("email"); setError(null); setCode(""); setInfo(null); }}
                className="text-xs text-slate-500 mb-4 flex items-center gap-1 hover:text-slate-700"
              >
                ← 이메일 변경
              </button>

              <h2 className="text-base font-semibold text-slate-800 mb-1">
                인증 코드 입력
              </h2>
              <p className="text-sm text-slate-500 mb-1">
                <span className="font-medium text-slate-700">{email}</span>으로<br />
                로그인 링크와 인증 코드를 발송했습니다.
              </p>

              {/* 스팸함 안내 (spec 필수 항목) */}
              <p className="text-xs text-gray-500 mb-4">
                메일이 도착하지 않았다면 스팸함 또는 프로모션함을 확인해 주세요.
              </p>

              {info && (
                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mb-4">
                  {info}
                </p>
              )}
              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={verifyCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    6자리 인증 코드
                  </label>
                  <input
                    ref={codeRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-center tracking-widest text-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="one-time-code"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {loading ? "확인 중..." : "로그인"}
                </button>

                <button
                  type="button"
                  onClick={requestLink}
                  disabled={loading}
                  className="w-full text-slate-500 text-xs py-1 hover:text-slate-700 transition-colors"
                >
                  코드 재발송
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          로그인 시{" "}
          <a href="/legal/privacy" className="underline hover:text-slate-600">
            개인정보처리방침
          </a>{" "}
          및{" "}
          <a href="/legal/terms" className="underline hover:text-slate-600">
            이용약관
          </a>
          에 동의합니다.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-slate-400 text-sm">로딩 중...</div>
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
