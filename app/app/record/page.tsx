"use client";

// app/app/record/page.tsx
// 일일 / 주간 기록 폼 (60초 이내 완료 목표)

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "daily" | "weekly" | "done";

// 오늘이 주간 기록 요일인지 판단 (매주 특정 요일)
function isWeeklyDay(): boolean {
  // 기본: 매주 일요일 (0) 주간 질문 표시
  const day = new Date().getDay();
  return day === 0;
}

export default function RecordPage() {
  const router = useRouter();
  const showWeekly = isWeeklyDay();

  const [step, setStep] = useState<Step>("daily");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Daily 상태
  const [medicationTaken, setMedicationTaken] = useState<boolean | null>(null);
  const [nauseaLevel, setNauseaLevel] = useState(0);
  const [vomiting, setVomiting] = useState(false);
  const [weightKg, setWeightKg] = useState("");

  // Weekly 상태
  const [weeklyWeight, setWeeklyWeight] = useState("");
  const [appetiteChange, setAppetiteChange] = useState("유지");
  const [exerciseFrequency, setExerciseFrequency] = useState("없음");

  async function submitDaily() {
    if (medicationTaken === null) {
      setError("복약 여부를 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/logs/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medication_taken: medicationTaken,
          nausea_level: nauseaLevel,
          vomiting,
          weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "저장에 실패했습니다.");
      }
      if (showWeekly) {
        setStep("weekly");
      } else {
        setStep("done");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWeekly() {
    if (!weeklyWeight || isNaN(parseFloat(weeklyWeight))) {
      setError("체중을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/logs/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight_kg: parseFloat(weeklyWeight),
          appetite_change: appetiteChange,
          exercise_frequency: exerciseFrequency,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "저장에 실패했습니다.");
      }
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">기록 완료</h2>
        <p className="text-sm text-slate-500 mb-6">오늘의 건강 상태가 저장되었습니다.</p>
        <button
          onClick={() => router.push("/app")}
          className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (step === "weekly") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">주간 기록</h1>
          <p className="text-sm text-slate-500 mt-1">이번 주 변화를 기록해 주세요.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          {/* 체중 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              이번 주 체중 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                placeholder="75.0"
                value={weeklyWeight}
                onChange={(e) => setWeeklyWeight(e.target.value)}
                className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-500">kg</span>
            </div>
          </div>

          {/* 식욕 변화 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              식욕/포만감 변화
            </label>
            <div className="flex gap-2">
              {["감소", "유지", "증가"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAppetiteChange(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    appetiteChange === v
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* 운동 빈도 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              이번 주 운동
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["없음", "주1회", "주2-3회", "주4회이상"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setExerciseFrequency(v)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    exerciseFrequency === v
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={submitWeekly}
          disabled={submitting}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {submitting ? "저장 중..." : "주간 기록 저장"}
        </button>
        <button
          onClick={() => setStep("done")}
          className="w-full text-slate-400 text-sm py-1 hover:text-slate-600"
        >
          건너뛰기
        </button>
      </div>
    );
  }

  // Daily step
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900">오늘 기록</h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
        {/* 복약 여부 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            오늘 투약했나요? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMedicationTaken(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                medicationTaken === true
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              네, 했어요
            </button>
            <button
              type="button"
              onClick={() => setMedicationTaken(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                medicationTaken === false
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-white text-slate-700 border-gray-300 hover:border-slate-400"
              }`}
            >
              아니요
            </button>
          </div>
        </div>

        {/* 오심 레벨 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            오심(메스꺼움) 정도
          </label>
          <p className="text-xs text-slate-400 mb-3">0 = 없음, 10 = 매우 심함</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={10}
              value={nauseaLevel}
              onChange={(e) => setNauseaLevel(Number(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span className={`w-8 text-center font-bold text-sm ${nauseaLevel >= 8 ? "text-red-600" : nauseaLevel >= 5 ? "text-amber-600" : "text-slate-700"}`}>
              {nauseaLevel}
            </span>
          </div>
          {nauseaLevel >= 8 && (
            <p className="text-xs text-red-600 mt-1">오심이 심하면 담당 의료진에게 연락하세요.</p>
          )}
        </div>

        {/* 구토 여부 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            오늘 구토가 있었나요?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setVomiting(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                vomiting
                  ? "bg-red-100 text-red-700 border-red-300"
                  : "bg-white text-slate-700 border-gray-300 hover:border-red-300"
              }`}
            >
              있었어요
            </button>
            <button
              type="button"
              onClick={() => setVomiting(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                !vomiting
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                  : "bg-white text-slate-700 border-gray-300 hover:border-emerald-300"
              }`}
            >
              없었어요
            </button>
          </div>
          {vomiting && (
            <p className="text-xs text-red-600 mt-2">구토가 지속되면 담당 의료진에게 연락하세요.</p>
          )}
        </div>

        {/* 체중 (선택) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            오늘 체중 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              placeholder="75.0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-500">kg</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={submitDaily}
        disabled={submitting}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
      >
        {submitting ? "저장 중..." : showWeekly ? "다음 (주간 기록)" : "기록 저장"}
      </button>
    </div>
  );
}
