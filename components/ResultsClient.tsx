"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisResult, UserData } from "@/lib/roadmap-engine";
import { getOrCreateAnonUserId } from "@/lib/anon-user";

type Snapshot = {
  ts: number;
  currentWeight: number;
  currentWeek: number;
};

const SNAPSHOT_KEY = "nw_last_snapshot_v1";

function readSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    if (typeof (parsed as any).currentWeight !== "number") return null;
    if (typeof (parsed as any).currentWeek !== "number") return null;

    return {
      ts: typeof (parsed as any).ts === "number" ? (parsed as any).ts : Date.now(),
      currentWeight: (parsed as any).currentWeight,
      currentWeek: (parsed as any).currentWeek,
    };
  } catch (e) {
    return null;
  }
}

function writeSnapshot(s: Snapshot) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s));
  } catch (e) {
    // ignore
  }
}

function formatDelta(lastWeight: number, currentWeight: number) {
  const d = currentWeight - lastWeight;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}kg`;
}

export default function ResultsClient({
  userData,
  analysis,
}: {
  userData: UserData;
  analysis: AnalysisResult;
}) {
  const [last, setLast] = useState<Snapshot | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  // read snapshot once
  useEffect(() => {
    setLast(readSnapshot());
  }, []);

  // write snapshot whenever key inputs change
  useEffect(() => {
    writeSnapshot({
      ts: Date.now(),
      currentWeight: userData.currentWeight,
      currentWeek: userData.currentWeek,
    });
  }, [userData.currentWeight, userData.currentWeek]);

  // fetch weekly report from server (logic+content lives on server)
  useEffect(() => {
    const run = async () => {
      try {
        const qs = new URLSearchParams();

        qs.set("userName", String(userData.userName ?? ""));
        qs.set("userAge", String(userData.userAge ?? ""));
        qs.set("userGender", String(userData.userGender ?? ""));

        qs.set("exercise", String((userData as any).exercise ?? ""));
        qs.set("muscleMass", String((userData as any).muscleMass ?? ""));
        qs.set("budget", String((userData as any).budget ?? ""));

        qs.set("mainConcern", String((userData as any).mainConcern ?? ""));
        qs.set("resolution", String((userData as any).resolution ?? ""));

        qs.set("currentWeight", String(userData.currentWeight));
        qs.set("targetWeight", String(userData.targetWeight));

        qs.set("drugStatus", String(userData.drugStatus));
        qs.set("drugType", String(userData.drugType));
        qs.set("currentDose", String((userData as any).currentDose ?? ""));
        qs.set("currentWeek", String(userData.currentWeek));
        qs.set("startDate", String((userData as any).startDate ?? ""));
        qs.set("startWeightBeforeDrug", String((userData as any).startWeightBeforeDrug ?? ""));

        if (last?.currentWeight != null) {
          qs.set("lastWeight", String(last.currentWeight));
        }

        const res = await fetch(`/api/weekly-report?${qs.toString()}`, { cache: "no-store" });
        const data = await res.json();
        setWeeklyReport(data);
      } catch (e) {
        setWeeklyReport(null);
      }
    };

    run();
  }, [
    userData.userName,
    userData.userAge,
    userData.userGender,
    (userData as any).exercise,
    (userData as any).muscleMass,
    (userData as any).budget,
    (userData as any).mainConcern,
    (userData as any).resolution,
    userData.currentWeight,
    userData.targetWeight,
    userData.drugStatus,
    userData.drugType,
    (userData as any).currentDose,
    userData.currentWeek,
    (userData as any).startDate,
    (userData as any).startWeightBeforeDrug,
    last?.currentWeight,
  ]);

  const deltaText = useMemo(() => {
    if (!last) return null;
    if (!Number.isFinite(last.currentWeight) || last.currentWeight <= 0) return null;
    return formatDelta(last.currentWeight, userData.currentWeight);
  }, [last, userData.currentWeight]);

  // send GA event only when a valid weekly report is actually rendered
  useEffect(() => {
    if (!weeklyReport) return;
    if (weeklyReport?.ok === false) return;

    try {
      // @ts-ignore
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        const userId = getOrCreateAnonUserId();
        // @ts-ignore
        window.gtag("event", "weekly_report_generated", {
          anon_user_id: userId,
        });
      }
    } catch (e) {
      // ignore
    }
  }, [weeklyReport]);

  // loading guard (prevents weeklyReport.* access crash)
  if (!weeklyReport) return null;
  if (weeklyReport?.ok === false) return null;

  const report = weeklyReport.content ?? weeklyReport;

  const impact =
    report?.muscleCapitalImpact ??
    report?.roi ?? {
      title: "근육 자본 효과",
      description: "이번 주 루틴이 다음 몇 달의 유지력과 요요 저항성을 만듭니다.",
      message: "이번 주는 단기 체중 변화보다, 근육 유지와 유지력 확보에 초점을 둔 주간입니다.",
    };

  const missionsArray = Array.isArray(report?.thisWeek?.missions) ? report.thisWeek.missions : [];
  const missions =
    missionsArray.length > 0
      ? typeof missionsArray[0] === "string"
        ? missionsArray.map((s: string) => ({ label: "핵심", detail: s }))
        : missionsArray
      : [];

  return (
    <section className="space-y-5 md:space-y-6" ref={reportRef}>
      <div className="relative rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
        <div className="text-base md:text-lg font-black text-slate-900">
          {report?.header?.title ?? "주간 코칭 리포트"}
        </div>

        {weeklyReport?.reportNo ? (
          <div className="absolute right-5 top-5 md:right-6 md:top-6 text-xs text-slate-400">
            {weeklyReport.reportNo}번째 리포트
          </div>
        ) : null}

        <div className="mt-1 text-xs md:text-sm text-slate-600">
          {report?.header?.subtitle ?? ""}
        </div>

        {report?.header?.coachIntro ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-800">
            {report.header.coachIntro}
          </div>
        ) : null}

        {deltaText ? (
          <div className="mt-4 text-xs md:text-[13px] text-slate-600">지난 입력 대비 체중 변화: {deltaText}</div>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
        <div className="text-sm md:text-base font-black text-slate-900">이번 주 설계</div>
        <div className="mt-2 text-sm leading-6 text-slate-700">{report?.thisWeek?.summary ?? ""}</div>
        {missions.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {missions.map((m: any, idx: number) => (
              <div key={idx} className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">{m.label ?? "핵심"}</div>
                <div className="mt-1 text-sm leading-6 text-slate-900">{m.detail ?? ""}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
          <div className="text-sm md:text-base font-black text-slate-900">{report?.nutrition?.title ?? "영양"}</div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-800 list-disc pl-5">
            {(report?.nutrition?.bullets ?? []).map((b: string, idx: number) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-500">예시</div>
            <div className="mt-1 space-y-1 text-sm text-slate-800">
              {(report?.nutrition?.examples ?? []).map((e: string, idx: number) => (
                <div key={idx}>• {e}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
          <div className="text-sm md:text-base font-black text-slate-900">{report?.training?.title ?? "운동"}</div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-800 list-disc pl-5">
            {(report?.training?.bullets ?? []).map((b: string, idx: number) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-500">예시</div>
            <div className="mt-1 space-y-1 text-sm text-slate-800">
              {(report?.training?.examples ?? []).map((e: string, idx: number) => (
                <div key={idx}>• {e}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
        <div className="text-sm md:text-base font-black text-slate-900">{impact.title ?? "근육 자본 효과"}</div>
        {impact.description ? (
          <div className="mt-2 text-xs md:text-[13px] leading-6 text-slate-600">{impact.description}</div>
        ) : null}
        <div className="mt-3 text-sm leading-6 text-slate-800">{impact.message ?? ""}</div>
      </div>

      <div className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
        <div className="text-sm md:text-base font-black text-slate-900">다음 주 예고</div>
        <div className="mt-2 text-sm leading-6 text-slate-800">{report?.nextWeek?.preview ?? ""}</div>
      </div>
    </section>
  );
}
