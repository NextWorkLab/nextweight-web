"use client";

// app/app/share/page.tsx
// 공유 토큰 관리 페이지

import { useState, useEffect, useCallback } from "react";
import type { ShareToken } from "@/lib/patient-types";

type ExpiryOption = { label: string; minutes: number };

const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: "10분", minutes: 10 },
  { label: "24시간", minutes: 1440 },
];

function isExpired(token: ShareToken) {
  return new Date(token.expires_at) < new Date() || !!token.revoked_at;
}

function timeLeft(expires_at: string) {
  const diff = new Date(expires_at).getTime() - Date.now();
  if (diff <= 0) return "만료됨";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 남음`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}시간 남음`;
}

export default function SharePage() {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<number>(10);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch("/api/share");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch {
      setError("토큰 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  async function createToken() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expires_minutes: selectedExpiry }),
      });
      if (!res.ok) throw new Error();
      await fetchTokens();
    } catch {
      setError("공유 링크 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function revokeToken(token: string) {
    try {
      await fetch(`/api/share/${token}`, { method: "DELETE" });
      await fetchTokens();
    } catch {
      setError("취소에 실패했습니다.");
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  const activeTokens = tokens.filter((t) => !isExpired(t));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-900">진료 공유</h1>
        <p className="text-sm text-slate-500 mt-1">
          의료진과 기록을 안전하게 공유합니다. 공유 링크는 일정 시간 후 자동 만료됩니다.
        </p>
      </div>

      {/* 새 공유 링크 생성 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">새 공유 링크 생성</h2>
        <div>
          <label className="block text-xs text-slate-500 mb-2">만료 시간</label>
          <div className="flex gap-2">
            {EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.minutes}
                type="button"
                onClick={() => setSelectedExpiry(opt.minutes)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selectedExpiry === opt.minutes
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
        )}
        <button
          onClick={createToken}
          disabled={creating}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {creating ? "생성 중..." : "공유 링크 생성"}
        </button>
      </div>

      {/* 활성 공유 링크 목록 */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          활성 공유 링크 ({activeTokens.length})
        </h2>
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-slate-400">
            불러오는 중...
          </div>
        ) : activeTokens.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-slate-400">
            활성 공유 링크가 없습니다.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {activeTokens.map((t) => (
              <div key={t.token} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-500 truncate">
                      /share/{t.token.slice(0, 16)}...
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeLeft(t.expires_at)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyLink(t.token)}
                      className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      {copiedToken === t.token ? "복사됨!" : "복사"}
                    </button>
                    <button
                      onClick={() => revokeToken(t.token)}
                      className="text-xs bg-gray-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">안내</p>
        <p>• 공유 링크는 만료되거나 취소하면 더 이상 사용할 수 없습니다.</p>
        <p>• 링크를 받은 사람은 로그인 없이 리포트를 열람할 수 있습니다.</p>
        <p>• 진료 후에는 공유를 취소하는 것을 권장합니다.</p>
      </div>
    </div>
  );
}
