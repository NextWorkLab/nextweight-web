// /components/OnboardingForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

export type DrugStatus = "사용 전" | "사용 중" | "중단";
export type DrugType = "MOUNJARO" | "WEGOVY" | "NONE";

export type FormData = {
  userName: string;
  userAge: number;
  userGender: "남성" | "여성";
  exercise: "안 함" | "주 1~2회" | "주 3회 이상";
  muscleMass: "모름" | "이하" | "표준" | "이상";
  budget: "실속형" | "표준형" | "집중형";

  currentWeight: number;
  targetWeight: number;

  drugStatus: DrugStatus;
  drugType: DrugType;

  startWeightBeforeDrug?: number;
  currentDose?: string;

  startDate?: string; // YYYY-MM-DD
  weekMode: "auto" | "manual";
  currentWeek: number;

  concern: "요요" | "근감소" | "부작용" | "정체기" | "동기" | "기타";
  resolution: string;
};

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 md:px-5 md:py-4 text-base outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

function safeNumber(v: any, fallback: number) {
  if (v === "" || v === null || v === undefined) return Number.NaN;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}


function yyyyMmDd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function calcWeekFromStartDate(startDate?: string) {
  if (!startDate) return 0;
  const s = new Date(startDate + "T00:00:00");
  if (Number.isNaN(s.getTime())) return 0;
  const now = new Date();
  const diff = now.getTime() - s.getTime();
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, weeks);
}

function doseOptions(drugType: DrugType) {
  if (drugType === "MOUNJARO") return ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];
  if (drugType === "WEGOVY") return ["0.25 mg", "0.5 mg", "1 mg", "1.7 mg", "2.4 mg"];
  return ["0 mg"];
}

export default function OnboardingForm({ onComplete }: { onComplete: (data: FormData) => void }) {
  const today = useMemo(() => yyyyMmDd(new Date()), []);

  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    userName: "",
    userAge: 35,
    userGender: "여성",
    exercise: "안 함",
    muscleMass: "모름",
    budget: "표준형",

    currentWeight: 80,
    targetWeight: 65,

    drugStatus: "사용 전",
    drugType: "MOUNJARO",

    startWeightBeforeDrug: undefined,
    currentDose: undefined,

    startDate: undefined,
    weekMode: "auto",
    currentWeek: 0,

    concern: "요요",
    resolution: "",
  });

  // 약물/상태 변화에 따른 기본값 보정
  useEffect(() => {
    const opts = doseOptions(formData.drugType);

    // 사용 전/중단이면 "0 mg"로 고정
    if (formData.drugStatus === "사용 전" || formData.drugStatus === "중단") {
      if (formData.currentDose !== "0 mg") {
        setFormData((p) => ({ ...p, currentDose: "0 mg" }));
      }
      return;
    }

    // 사용 중인데 용량이 비어있거나 해당 약물 옵션에 없으면 첫 옵션으로
    if (formData.drugStatus === "사용 중") {
      if (!formData.currentDose || !opts.includes(formData.currentDose)) {
        setFormData((p) => ({ ...p, currentDose: opts[0] }));
      }
    }
  }, [formData.drugType, formData.drugStatus]);

  // 자동 주차 계산
  useEffect(() => {
    if (formData.weekMode !== "auto") return;
    const w = calcWeekFromStartDate(formData.startDate);
    if (w !== formData.currentWeek) {
      setFormData((p) => ({ ...p, currentWeek: w }));
    }
  }, [formData.startDate, formData.weekMode, formData.currentWeek]);

  const showDrugFields = formData.drugStatus === "사용 중";
  const requireStartWeight = showDrugFields && formData.drugType !== "NONE";

  // 주간 코칭 리포트는 앞 단계 모든 입력이 완료되어야 생성 가능
  const canSubmit = useMemo(() => {
    const nameOk = String(formData.userName ?? "").trim().length > 0;
    const resolutionOk = String(formData.resolution ?? "").trim().length > 0;

    const ageOk = Number.isFinite(formData.userAge) && formData.userAge >= 10 && formData.userAge <= 120;
    const currentWeightOk = Number.isFinite(formData.currentWeight) && formData.currentWeight > 0;
    const targetWeightOk = Number.isFinite(formData.targetWeight) && formData.targetWeight > 0;
    const drugTypeOk = formData.drugType !== "NONE";
    const weekOk = Number.isFinite(formData.currentWeek) && formData.currentWeek >= 0;

    const baseOk = nameOk && resolutionOk && ageOk && currentWeightOk && targetWeightOk && drugTypeOk && weekOk;

    if (!showDrugFields) {
      // 사용 전/중단은 currentDose가 0 mg로 고정되므로, 제출 시점에만 보정하면 됨
      return baseOk;
    }

    const startDateOk = !!formData.startDate && !Number.isNaN(new Date(formData.startDate + "T00:00:00").getTime());
    const doseOk = String(formData.currentDose ?? "").trim().length > 0;
    const startWeightOk = !requireStartWeight || (typeof formData.startWeightBeforeDrug === "number" && Number.isFinite(formData.startWeightBeforeDrug) && formData.startWeightBeforeDrug > 0);

    return baseOk && startDateOk && doseOk && startWeightOk;
  }, [
    formData.userName,
    formData.resolution,
    formData.userAge,
    formData.currentWeight,
    formData.targetWeight,
    formData.drugType,
    formData.currentWeek,
    formData.startDate,
    formData.currentDose,
    formData.startWeightBeforeDrug,
    showDrugFields,
    requireStartWeight,
  ]);

  return (
    <form
      className="space-y-5 md:space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setFormError(null);

        if (!String(formData.userName ?? "").trim()) {
          setFormError("성함을 입력해 주세요.");
          return;
        }

        if (!String(formData.resolution ?? "").trim()) {
          setFormError("다이어트 각오를 입력해 주세요.");
          return;
        }

        if (formData.drugType === "NONE") {
          setFormError("약물 선택에서 '선택 안 함'은 사용할 수 없습니다. 위고비/마운자로 중 하나를 선택해 주세요.");
          return;
        }

        // 사용 중(ON)일 때, 투약 전 시작 체중은 '현재 위치(dot)' 계산에 필수
        if (requireStartWeight) {
          const w = formData.startWeightBeforeDrug;
          if (typeof w !== "number" || !Number.isFinite(w) || w <= 0) {
            setFormError("사용 중일 때는 투약 전 시작 체중(kg)을 입력해 주세요.");
            return;
          }
        }

        // 사용 중(ON)일 때는 시작일/용량도 필수
        if (showDrugFields) {
          if (!formData.startDate) {
            setFormError("사용 중일 때는 투약 시작일을 입력해 주세요.");
            return;
          }
          if (!formData.currentDose) {
            setFormError("사용 중일 때는 현재 투약 용량을 선택해 주세요.");
            return;
          }
        }

        const normalized: FormData = {
          ...formData,
          userAge: Number.isFinite(formData.userAge) ? formData.userAge : 35,
          currentWeight: Number.isFinite(formData.currentWeight) ? formData.currentWeight : 0,
          targetWeight: Number.isFinite(formData.targetWeight) ? formData.targetWeight : 0,
          currentWeek: Number.isFinite(formData.currentWeek) ? formData.currentWeek : 0,
          // 사용 전/중단은 currentDose가 0 mg로 유지되도록 보정
          currentDose:
            formData.drugStatus === "사용 전" || formData.drugStatus === "중단"
              ? "0 mg"
              : formData.currentDose,
        };

        if (!canSubmit) {
          setFormError("입력값이 부족합니다. 모든 항목을 입력해 주세요.");
          return;
        }

        onComplete(normalized);
      }}
    >
      {formError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {formError}
        </div>
      )}

      {/* 기본 정보 */}
      <div className="rounded-[24px] md:rounded-[28px] border border-slate-200 bg-white p-5 md:p-8">
        <div className="mb-4 md:mb-5 text-base md:text-lg font-black text-slate-900">기본 정보</div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">성함</label>
              <input
                type="text"
                className={inputClass}
                placeholder="예: 홍길동"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">나이</label>
              <input
                type="number"
                className={inputClass}
                value={formData.userAge}
                onChange={(e) => setFormData({ ...formData, userAge: safeNumber(e.target.value, 35) })}
                min={10}
                max={120}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">성별</label>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, userGender: "여성" })}
                className={`rounded-2xl border px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base font-black transition-colors ${
                  formData.userGender === "여성"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                여성
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, userGender: "남성" })}
                className={`rounded-2xl border px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base font-black transition-colors ${
                  formData.userGender === "남성"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                남성
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 체중 정보 */}
      <div className="rounded-[24px] md:rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-8">
        <div className="mb-4 md:mb-5 text-base md:text-lg font-black text-slate-900">체중 정보</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">현재 체중 (kg)</label>
            <input
              type="number"
              className={inputClass}
              value={formData.currentWeight}
              onChange={(e) => setFormData({ ...formData, currentWeight: safeNumber(e.target.value, 80) })}
              min={0}
              step={0.1}
              placeholder="예: 80"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">목표 체중 (kg)</label>
            <input
              type="number"
              className={inputClass}
              value={formData.targetWeight}
              onChange={(e) => setFormData({ ...formData, targetWeight: safeNumber(e.target.value, 65) })}
              min={0}
              step={0.1}
              placeholder="예: 65"
            />
          </div>
        </div>
      </div>

      {/* 운동/근육량/예산 */}
      <div className="rounded-[24px] md:rounded-[28px] border border-slate-200 bg-white p-5 md:p-8">
        <div className="mb-4 md:mb-5 text-base md:text-lg font-black text-slate-900">생활 습관</div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">운동 빈도</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              {["안 함", "주 1~2회", "주 3회 이상"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, exercise: option as any })}
                  className={`rounded-2xl border px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base font-black transition-colors ${
                    formData.exercise === option
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">근육량 (체성분 기준)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
              {["모름", "이하", "표준", "이상"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, muscleMass: option as any })}
                  className={`rounded-2xl border px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base font-black transition-colors ${
                    formData.muscleMass === option
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">예산</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              {["실속형", "표준형", "집중형"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormData({ ...formData, budget: option as any })}
                  className={`rounded-2xl border px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base font-black transition-colors ${
                    formData.budget === option
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 투약 정보 */}
      <div className="rounded-[24px] md:rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-8">
        <div className="mb-4 md:mb-5 text-base md:text-lg font-black text-slate-900">투약 정보</div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">투약 상태</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, drugStatus: "사용 전", startDate: undefined, currentWeek: 0 })}
                className={`rounded-2xl border px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base font-black transition-colors ${
                  formData.drugStatus === "사용 전"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                사용 전
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    drugStatus: "사용 중",
                    startDate: formData.startDate ?? today,
                    weekMode: "auto",
                  })
                }
                className={`rounded-2xl border px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base font-black transition-colors ${
                  formData.drugStatus === "사용 중"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                사용 중
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    drugStatus: "중단",
                    startDate: undefined,
                    weekMode: "manual",
                    currentWeek: 0,
                  })
                }
                className={`rounded-2xl border px-4 py-3.5 md:px-5 md:py-4 text-sm md:text-base font-black transition-colors ${
                  formData.drugStatus === "중단"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                중단
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">약물 선택</label>
            <select
              className={inputClass}
              value={formData.drugType}
              onChange={(e) => setFormData({ ...formData, drugType: e.target.value as any })}
            >
              <option value="MOUNJARO">마운자로</option>
              <option value="WEGOVY">위고비</option>
              <option value="NONE">선택 안 함</option>
            </select>
          </div>

          {showDrugFields && (
            <>
              <div>
                <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">투약 전 시작 체중 (kg)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={formData.startWeightBeforeDrug ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startWeightBeforeDrug: e.target.value === "" ? undefined : safeNumber(e.target.value, 0),
                    })
                  }
                  min={0}
                  step={0.1}
                  placeholder="예: 104"
                />
                {requireStartWeight ? (
                  <div className="mt-2 text-xs md:text-[12px] leading-5 text-slate-500">
                    현재 체중 위치(dot)와 평균 대비 격차 계산에 필요합니다.
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">현재 투약 용량</label>
                <select
                  className={inputClass}
                  value={formData.currentDose ?? doseOptions(formData.drugType)[0]}
                  onChange={(e) => setFormData({ ...formData, currentDose: e.target.value })}
                >
                  {doseOptions(formData.drugType).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs md:text-[12px] leading-5 text-slate-500">약물 기준으로 용량 단계를 선택하세요.</div>
              </div>

              <div>
                <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">투약 시작일</label>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.startDate ?? ""}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
                <div className="mt-2 text-xs md:text-[12px] leading-5 text-slate-500">시작일 기준으로 현재 주차를 자동 계산합니다.</div>
              </div>

              <div>
                <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">현재 투약 주차</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="number"
                    className={`${inputClass} flex-1`}
                    value={Number.isFinite(formData.currentWeek) ? formData.currentWeek : ""}
                    onChange={(e) => setFormData({ ...formData, currentWeek: safeNumber(e.target.value, 0) })}
                    disabled={formData.weekMode === "auto"}
                    min={0}
                  />
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, weekMode: "auto" })}
                      className={`px-4 py-3.5 md:px-5 md:py-4 rounded-2xl text-sm md:text-base font-black border transition-colors ${
                        formData.weekMode === "auto"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      자동
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, weekMode: "manual" })}
                      className={`px-4 py-3.5 md:px-5 md:py-4 rounded-2xl text-sm md:text-base font-black border transition-colors ${
                        formData.weekMode === "manual"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      수동
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs md:text-[12px] leading-5 text-slate-500">
                  자동 계산값: {calcWeekFromStartDate(formData.startDate)}주차 (필요하면 수동으로 보정하세요)
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 고민 */}
      <div className="rounded-[24px] md:rounded-[28px] border border-slate-200 bg-white p-5 md:p-8">
        <div className="mb-4 md:mb-5 text-base md:text-lg font-black text-slate-900">고민</div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">다이어트에서 가장 큰 고민</label>
            <select
              className={inputClass}
              value={formData.concern}
              onChange={(e) => setFormData({ ...formData, concern: e.target.value as any })}
            >
              <option value="요요">요요</option>
              <option value="근감소">근감소</option>
              <option value="부작용">부작용</option>
              <option value="정체기">정체기</option>
              <option value="동기">동기</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs md:text-[13px] font-semibold text-slate-600">다이어트 각오</label>
            <textarea
              className={`${inputClass} min-h-[110px]`}
              placeholder="예: 이번에는 기필코..."
              value={formData.resolution}
              onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full py-5 md:py-6 font-black text-base md:text-lg rounded-[20px] md:rounded-[22px] shadow-xl transition-all ${
          canSubmit ? "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700" : "bg-slate-200 text-slate-500 cursor-not-allowed"
        }`}
      >
        주간 코칭 리포트 받기
      </button>

      <div className="mt-5 md:mt-6 text-center">
        <a href="/privacy" className="text-xs text-slate-400 hover:text-slate-600">
          개인정보 처리방침
        </a>
      </div>

    </form>
  );
}
