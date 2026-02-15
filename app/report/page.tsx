import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generatePersonalizedAnalysis } from "@/lib/roadmap-engine";
import type { UserData } from "@/lib/roadmap-engine";

function safeNumber(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default async function ReportPage({
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

  const ck = await cookies();
  const freeUsed = ck.get("nw_pdf_free_used")?.value === "1";

  // 2회차부터는 로그인(세션) 체크로 바꾸게 될 자리
  // MVP: 로그인 구현 전까지는 freeUsed면 안내 페이지로 보내도 됨
  if (freeUsed) {
    redirect(`/report/locked?${sp.toString()}`);
  }

  const rawDrugStatus = sp.get("drugStatus") as any;
  const rawDrugType = sp.get("drugType") as any;
  const mappedDrugStatus: any =
    rawDrugStatus === "사용 중"
      ? "ON"
      : rawDrugStatus === "중단"
        ? "OFF"
        : rawDrugStatus === "사용 전"
          ? "PRE"
          : (rawDrugStatus || "PRE");
  const mappedDrugType: any = rawDrugType === "NONE" ? "MOUNJARO" : (rawDrugType || "MOUNJARO");

  const requireStartWeight = mappedDrugStatus === "ON" && rawDrugType !== "NONE";
  const userData: UserData = {
    userName: sp.get("userName") || undefined,
    userAge: safeNumber(sp.get("userAge"), 35),
    userGender: (sp.get("userGender") as any) || "여성",
    currentWeight: safeNumber(sp.get("currentWeight"), 80),
    targetWeight: safeNumber(sp.get("targetWeight"), 65),
    drugStatus: mappedDrugStatus,
    drugType: mappedDrugType,
    startWeightBeforeDrug: requireStartWeight
      ? safeNumber(sp.get("startWeightBeforeDrug"), safeNumber(sp.get("currentWeight"), 80))
      : undefined,
    currentDose: sp.get("currentDose") || undefined,
    currentWeek: safeNumber(sp.get("currentWeek"), 1),
    startDate: sp.get("startDate") || undefined,
    muscleMass: (sp.get("muscleMass") as any) || "표준",
    exercise: (sp.get("exercise") as any) || "안 함",
    budget: (sp.get("budget") as any) || "표준형",
    mainConcern: (sp.get("mainConcern") as any) || "요요",
    resolution: sp.get("resolution") || undefined,
  };

  const analysis = generatePersonalizedAnalysis(userData);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="print:hidden flex items-center justify-between gap-3">
          <div>
            <div className="text-lg text-slate-900">NextWeight PDF 리포트</div>
            <div className="text-sm text-slate-500">1회 무료 제공</div>
          </div>

          <form action="/api/report/consume-free" method="POST">
            <input type="hidden" name="q" value={sp.toString()} />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-white"
            >
              PDF로 저장하기
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border p-6">
          <div className="text-xl text-slate-900">요약</div>
          <div className="mt-2 text-sm text-slate-700">
            {userData.userName ? `${userData.userName} · ` : ""}
            {userData.currentWeek}주차 · {userData.drugType === "MOUNJARO" ? "마운자로" : "위고비"}
            {userData.currentDose ? ` · ${userData.currentDose}` : ""}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">현재 단계</div>
              <div className="mt-1 text-base text-slate-900">
                {analysis?.currentStage?.name || "—"}
              </div>
              <div className="mt-2 text-sm text-slate-700">
                {analysis?.currentStage?.msg || ""}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">이번 주 미션</div>
              <div className="mt-1 text-sm text-slate-900">
                G / P / S 한 줄 미션(현재 results 콘텐츠 테이블에서 가져와도 되고, 여기서 별도 요약만 둬도 됨)
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            이 리포트는 정보 제공 목적이며, 개인의 의학적 판단을 대체하지 않습니다.
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </main>
  );
}
