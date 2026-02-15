import { NextRequest, NextResponse } from "next/server";
import content from "@/content/strategy-content.json";

type StrategyKey = keyof typeof content;

const STRATEGY_LABEL: Record<StrategyKey, string> = {
  SAFE: "근손실 방어",
  BALANCED: "대사 균형",
  AGGRESSIVE: "감량 가속",
  EXIT: "요요 방어",
};

function isNonEmpty(v: string | null) {
  return !!v && String(v).trim().length > 0;
}

function isValidNumber(n: number) {
  return Number.isFinite(n);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // 주간 코칭 리포트는 앞 단계 모든 Field를 기반으로 생성됩니다.
  // (전략 판정 및 콘텐츠 선택은 서버에서만 수행)

  const missing: string[] = [];

  // 문자열 필드
  if (!isNonEmpty(searchParams.get("userName"))) missing.push("userName");
  if (!isNonEmpty(searchParams.get("userGender"))) missing.push("userGender");
  if (!isNonEmpty(searchParams.get("exercise"))) missing.push("exercise");
  if (!isNonEmpty(searchParams.get("muscleMass"))) missing.push("muscleMass");
  if (!isNonEmpty(searchParams.get("budget"))) missing.push("budget");
  if (!isNonEmpty(searchParams.get("mainConcern"))) missing.push("mainConcern");
  if (!isNonEmpty(searchParams.get("resolution"))) missing.push("resolution");

  const drugStatus = searchParams.get("drugStatus");
  const drugType = searchParams.get("drugType");
  const currentDose = searchParams.get("currentDose");

  if (!isNonEmpty(drugStatus)) missing.push("drugStatus");
  if (!isNonEmpty(drugType)) missing.push("drugType");
  if (!isNonEmpty(currentDose)) missing.push("currentDose");

  // 수치 필드
  const userAge = Number(searchParams.get("userAge"));
  if (!(isValidNumber(userAge) && userAge >= 10 && userAge <= 120)) missing.push("userAge");

  const currentWeek = Number(searchParams.get("currentWeek"));
  if (!(isValidNumber(currentWeek) && currentWeek >= 0)) missing.push("currentWeek");

  const currentWeight = Number(searchParams.get("currentWeight"));
  if (!(isValidNumber(currentWeight) && currentWeight > 0)) missing.push("currentWeight");

  const targetWeight = Number(searchParams.get("targetWeight"));
  if (!(isValidNumber(targetWeight) && targetWeight > 0)) missing.push("targetWeight");

  // drugType은 NONE을 허용하지 않음
  if (drugType === "NONE") missing.push("drugType(NONE_not_allowed)");

  // 사용 중(ON)일 때만 추가 필드 필수
  if (drugStatus === "ON") {
    if (!isNonEmpty(searchParams.get("startDate"))) missing.push("startDate");
    const startWeightBeforeDrug = Number(searchParams.get("startWeightBeforeDrug"));
    if (!(isValidNumber(startWeightBeforeDrug) && startWeightBeforeDrug > 0)) missing.push("startWeightBeforeDrug");
  }

  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "입력값이 부족합니다.",
        missing,
      },
      { status: 400 }
    );
  }

  const lastWeightRaw = searchParams.get("lastWeight");
  const lastWeight = lastWeightRaw && isValidNumber(Number(lastWeightRaw)) ? Number(lastWeightRaw) : null;

  let strategy: StrategyKey = "BALANCED";

  if (drugStatus === "OFF") strategy = "EXIT";
  else if (userAge >= 60) strategy = "SAFE";
  else if (currentWeek <= 4) strategy = "BALANCED";
  else if (lastWeight !== null && currentWeight < lastWeight) strategy = "AGGRESSIVE";

  return NextResponse.json({
    ok: true,
    strategyKey: strategy,
    strategyName: STRATEGY_LABEL[strategy],
    content: content[strategy],
  });

}
