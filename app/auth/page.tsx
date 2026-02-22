"use client";

// app/auth/page.tsx
// OTP 기반 휴대폰 인증 페이지

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/app";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  function formatPhone(raw: string) {
    return raw.replace(/[^0-9]/g, "").slice(0, 11);
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (phone.length < 10) {
      setError("올바른 휴대폰 번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류가 발생했습니다.");
      // 개발 환경: 서버가 코드를 응답에 포함하면 자동 입력
      if (data.dev_code) {
        setOtp(String(data.dev_code));
        setInfo(`[개발] 인증번호: ${data.dev_code}`);
      } else {
        setInfo("인증번호가 발송되었습니다. 문자 메시지를 확인해 주세요.");
      }
      setStep("otp");
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      setError("6자리 인증번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
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
          {step === "phone" ? (
            <>
              <h2 className="text-base font-semibold text-slate-800 mb-1">
                휴대폰 번호로 로그인
              </h2>
              <p className="text-sm text-slate-500 mb-5">
                비밀번호 없이 인증번호로 시작합니다.
              </p>
              <form onSubmit={requestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    휴대폰 번호
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="01012345678"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    autoComplete="tel"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {loading ? "발송 중..." : "인증번호 받기"}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("phone"); setError(null); setOtp(""); }}
                className="text-xs text-slate-500 mb-4 flex items-center gap-1 hover:text-slate-700"
              >
                ← 번호 변경
              </button>
              <h2 className="text-base font-semibold text-slate-800 mb-1">
                인증번호 입력
              </h2>
              <p className="text-sm text-slate-500 mb-5">
                <span className="font-medium text-slate-700">{phone}</span>으로 발송된 6자리 번호를 입력하세요.
              </p>
              {info && (
                <p className="text-xs text-blue-700 bg-blue-50 rounded px-3 py-2 mb-4">{info}</p>
              )}
              <form onSubmit={verifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    인증번호
                  </label>
                  <input
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="one-time-code"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {loading ? "확인 중..." : "로그인"}
                </button>
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={loading}
                  className="w-full text-slate-500 text-xs py-1 hover:text-slate-700"
                >
                  인증번호 재발송
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          로그인 시{" "}
          <a href="/legal/privacy" className="underline">개인정보처리방침</a> 및{" "}
          <a href="/legal/terms" className="underline">이용약관</a>에 동의합니다.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-slate-400 text-sm">로딩 중...</div></div>}>
      <AuthForm />
    </Suspense>
  );
}
