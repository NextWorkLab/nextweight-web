import { generatePersonalizedAnalysis } from "@/lib/roadmap-engine";
import type { UserData } from "@/lib/roadmap-engine";
import RoadmapChart from "@/components/RoadmapChart";
import ResultsClient from "@/components/ResultsClient";

function safeNumber(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isNonEmpty(v: string | null) {
  return !!v && String(v).trim().length > 0;
}

function errorPage(message: string, details?: string[]) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <section className="rounded-2xl bg-white shadow-sm border p-6">
          <div className="text-xl font-semibold text-slate-900">입력값이 부족합니다</div>
          <div className="mt-2 text-slate-700">{message}</div>
          {details && details.length > 0 ? (
            <ul className="mt-4 list-disc pl-6 text-[14px] text-slate-700">
              {details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5">
            <a href="/" className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white">
              다시 입력하기
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function compactDrugStatus(v: UserData["drugStatus"]): string {
  if (v === "ON") return "사용 중";
  if (v === "OFF") return "중단";
  return "사용 전";
}

function compactDrugLabel(v: UserData["drugType"]): string {
  if (v === "WEGOVY") return "위고비";
  return "마운자로";
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const spObj = await searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(spObj)) {
    if (Array.isArray(v)) {
      if (v[0] != null) sp.set(k, v[0]);
    } else if (v != null) sp.set(k, v);
  }

  const rawDrugStatus = sp.get("drugStatus") as any;
  const rawDrugType = sp.get("drugType") as any;

  const mappedDrugStatus: any =
    rawDrugStatus === "사용 중"
      ? "ON"
      : rawDrugStatus === "사용 전"
        ? "PRE"
        : rawDrugStatus === "중단"
          ? "OFF"
          : rawDrugStatus;

  const mappedDrugType: any = rawDrugType;

  // 주간 코칭 리포트는 앞 단계 모든 Field가 입력되어야 생성됩니다.
  // 필수 Field 누락/형식 오류 시, 결과 페이지에서 차단합니다.

  const missing: string[] = [];

  if (!isNonEmpty(sp.get("userName"))) missing.push("성함");
  if (!isNonEmpty(sp.get("resolution"))) missing.push("다이어트 각오");
  if (!isNonEmpty(sp.get("userGender"))) missing.push("성별");
  if (!isNonEmpty(sp.get("exercise"))) missing.push("주간 운동 빈도");
  if (!isNonEmpty(sp.get("muscleMass"))) missing.push("골격근량");
  if (!isNonEmpty(sp.get("budget"))) missing.push("다이어트 관리 예산");
  if (!isNonEmpty(sp.get("mainConcern"))) missing.push("다이어트에서 가장 큰 고민");
  if (!isNonEmpty(sp.get("drugStatus"))) missing.push("투약 상태");
  if (!isNonEmpty(sp.get("drugType"))) missing.push("약물 선택");

  if (mappedDrugStatus !== "PRE" && mappedDrugStatus !== "ON" && mappedDrugStatus !== "OFF") {
    missing.push("투약 상태(형식 오류)");
  }

  if (mappedDrugType !== "WEGOVY" && mappedDrugType !== "MOUNJARO" && mappedDrugType !== "NONE") {
    missing.push("약물 선택(형식 오류)");
  }

  const age = safeNumber(sp.get("userAge"), Number.NaN);
  if (!(Number.isFinite(age) && age >= 10 && age <= 120)) missing.push("나이");

  const currentWeight = safeNumber(sp.get("currentWeight"), Number.NaN);
  if (!(Number.isFinite(currentWeight) && currentWeight > 0)) missing.push("현재 체중");

  const targetWeight = safeNumber(sp.get("targetWeight"), Number.NaN);
  if (!(Number.isFinite(targetWeight) && targetWeight > 0)) missing.push("목표 체중");

  const currentWeek = safeNumber(sp.get("currentWeek"), Number.NaN);
  if (!(Number.isFinite(currentWeek) && currentWeek >= 0)) missing.push("현재 주차");

  // drugType은 NONE 허용하지 않음
  if (rawDrugType === "NONE") missing.push("약물 선택(선택 안 함 불가)");

  // currentDose는 투약 상태와 무관하게 항상 존재하도록(사용 전/중단은 0 mg)
  if (!isNonEmpty(sp.get("currentDose"))) missing.push("현재 투약 용량");

  const requireStartWeight = mappedDrugStatus === "ON" && rawDrugType !== "NONE";

  if (mappedDrugStatus === "ON") {
    if (!isNonEmpty(sp.get("startDate"))) missing.push("투약 시작일");
    if (!isNonEmpty(sp.get("startWeightBeforeDrug"))) missing.push("투약 전 시작 체중");
  }

  if (missing.length > 0) {
    return errorPage("주간 코칭 리포트는 모든 입력 항목이 필요합니다.", missing);
  }
  const rawStartWeight = sp.get("startWeightBeforeDrug");
  const parsedStartWeight = rawStartWeight == null || rawStartWeight === "" ? NaN : Number(rawStartWeight);
  if (requireStartWeight && !(Number.isFinite(parsedStartWeight) && parsedStartWeight > 0)) {
    return errorPage("사용 중일 때는 투약 전 시작 체중(kg)이 필요합니다.");
  }

  const userData: UserData = {
    userName: sp.get("userName") || undefined,
    userAge: age,
    userGender: (sp.get("userGender") as any) || undefined,

    currentWeight,
    targetWeight,

    drugStatus: mappedDrugStatus,
    drugType: mappedDrugType,
    startWeightBeforeDrug: requireStartWeight ? safeNumber(sp.get("startWeightBeforeDrug"), Number.NaN) : undefined,

    currentDose: sp.get("currentDose") || undefined,
    currentWeek,
    startDate: sp.get("startDate") || undefined,

    muscleMass: (sp.get("muscleMass") as any) || undefined,
    exercise: (sp.get("exercise") as any) || undefined,
    budget: (sp.get("budget") as any) || undefined,

    mainConcern: (sp.get("mainConcern") as any) || undefined,
    resolution: sp.get("resolution") || undefined,
  };

  const analysis = generatePersonalizedAnalysis(userData);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <header className="space-y-2">
          <div className="text-[22px] md:text-[26px] font-black tracking-tight text-slate-900">주간 코칭 리포트</div>
          <div className="text-[14px] text-slate-600 leading-6">
            투약·식사·운동을 한 덩어리로 관리해 요요를 막는 실행 계획을 제공합니다.
          </div>
        </header>

        <section className="rounded-2xl bg-white shadow-sm border p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[16px] font-black text-slate-900">내 정보</div>
            <a href="/" className="text-[13px] text-slate-600 hover:text-slate-900">다시 입력하기</a>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] font-semibold text-slate-500">나이</div>
                <div className="text-[14px] text-slate-900">{userData.userAge}세</div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] font-semibold text-slate-500">현재/목표 체중</div>
                <div className="text-[14px] text-slate-900">{userData.currentWeight.toFixed(1)}kg → {userData.targetWeight.toFixed(1)}kg</div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] font-semibold text-slate-500">투약</div>
                <div className="text-[14px] text-slate-900">
                  {compactDrugStatus(userData.drugStatus)} · {compactDrugLabel(userData.drugType)}
                  {userData.currentDose ? ` · ${userData.currentDose}` : ""}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] font-semibold text-slate-500">현재 주차</div>
                <div className="text-[14px] text-slate-900">{userData.currentWeek}주차</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white shadow-sm border p-6">
          <div className="text-[16px] font-black text-slate-900 mb-4">체중 변화 예측</div>
          <RoadmapChart analysis={analysis} />
           <p className="mt-4 text-xs text-slate-400 leading-relaxed">
    이 그래프는 위고비 및 마운자로 임상시험에서 보고된 평균 체중 변화 추이를 기반으로 한 참고 곡선입니다.
    개인의 반응은 생활습관, 약물 순응도, 신체 상태에 따라 크게 달라질 수 있습니다.
  </p>
        </section>

        <ResultsClient userData={userData} analysis={analysis} />
      </div>
    </main>
  );
}
