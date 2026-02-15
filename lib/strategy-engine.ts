import type { AnalysisResult, BudgetTier, DrugStatus, UserData } from "@/lib/roadmap-engine";

export type StrategyType = "SAFE" | "BALANCED" | "AGGRESSIVE";

export type MuscleCapitalRisk = "낮음" | "중간" | "높음";

export type WeeklyReport = {
  strategy: StrategyType;
  isExitMode: boolean;
  muscleCapitalRisk: MuscleCapitalRisk;

  header: {
    title: string;
    subtitle: string;
    coachIntro: string;
  };

  thisWeek: {
    summary: string;
    missions: Array<{ label: string; detail: string }>; // 3개 정도
  };

  nutrition: {
    title: string;
    bullets: string[];
    examples: string[];
  };

  training: {
    title: string;
    bullets: string[];
    examples: string[];
  };

  roi: {
    title: string;
    message: string;
  };

  nextWeek: {
    preview: string;
  };
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function budgetToLabel(budget: BudgetTier): string {
  return budget;
}

function computeMuscleCapitalRisk(args: {
  userAge?: number;
  startBMI?: number | null;
  muscleMass: UserData["muscleMass"];
  weeklyLossPct?: number | null;
}): MuscleCapitalRisk {
  let score = 0;

  const age = args.userAge ?? 35;
  if (age >= 60) score += 2;
  else if (age >= 45) score += 1;

  if (args.muscleMass === "이하") score += 2;
  else if (args.muscleMass === "모름") score += 1;

  if (args.startBMI != null && args.startBMI < 30) score += 1;

  if (args.weeklyLossPct != null) {
    if (args.weeklyLossPct >= 1.5) score += 2;
    else if (args.weeklyLossPct >= 1.0) score += 1;
  }

  if (score >= 5) return "높음";
  if (score >= 3) return "중간";
  return "낮음";
}

export function decideStrategyType(args: {
  drugStatus: DrugStatus;
  userAge?: number;
  currentWeek: number;
  weeklyLossPct?: number | null;
}): { strategy: StrategyType; isExitMode: boolean } {
  // Exit Strategy: 중단(OFF) 감지 시 4주 Safe 강제
  if (args.drugStatus === "OFF") {
    return { strategy: "SAFE", isExitMode: true };
  }

  const age = args.userAge ?? 35;
  if (age >= 60) return { strategy: "SAFE", isExitMode: false };

  // 초기 4주는 '적응기'로 보고 무리한 공격 모드 금지
  if (args.currentWeek <= 4) return { strategy: "BALANCED", isExitMode: false };

  // 급격 감량 구간은 안전/표준 우선
  if (args.weeklyLossPct != null && args.weeklyLossPct >= 1.5) {
    return { strategy: age >= 45 ? "SAFE" : "BALANCED", isExitMode: false };
  }

  return { strategy: "AGGRESSIVE", isExitMode: false };
}

function safeModeContent(args: {
  budget: BudgetTier;
  risk: MuscleCapitalRisk;
  drugStatus: DrugStatus;
}): Pick<WeeklyReport, "header" | "thisWeek" | "nutrition" | "training" | "roi" | "nextWeek"> {
  const budgetLabel = budgetToLabel(args.budget);
  const baseIntro =
    "근육 손실은 자본을 파는 행위입니다. 이번 주는 체중보다 근육과 습관을 지키는 것이 목표입니다.";

  const exitNote =
    args.drugStatus === "OFF"
      ? "약물 중단 후 첫 한 달은 요요 방어의 골든타임입니다. 감량이 아니라 유지에 집중해도 성공입니다."
      : "";

  return {
    header: {
      title: "실속형 Safe 모드",
      subtitle: args.drugStatus === "OFF" ? "중단 후 요요 방어" : "근육 자본 방어",
      coachIntro: [baseIntro, exitNote].filter(Boolean).join(" "),
    },
    thisWeek: {
      summary: "이번 주는 단백질과 근력 운동을 먼저 고정하고, 감량 속도를 과속하지 않도록 설계합니다.",
      missions: [
        { label: "식사", detail: "류신 스위치: 유청 단백질 1스쿱 또는 계란 2개+흰자 2개" },
        { label: "운동", detail: "대근육 저항 운동 주 3회 (스쿼트/런지/힙힌지)" },
        { label: "생활", detail: "수분 2L + 식사 시간 고정" },
      ],
    },
    nutrition: {
      title: "정밀 식단 가이드",
      bullets: [
        "단백질: 체중 1kg당 1.2~1.5g 목표",
        "끼니마다 류신 2.5~3.0g 임계치 달성",
        "도토리묵·두부를 활용해 포만감은 올리고 칼로리는 낮춥니다.",
      ],
      examples: [
        "아침: 유청 단백질 쉐이크 1회",
        "점심: 닭안심/생선 + 나물/채소",
        "저녁: 국물은 줄이고 두부·건더기 위주",
      ],
    },
    training: {
      title: "운동 가이드",
      bullets: [
        "유산소보다 근력 비중을 높입니다(근력 80% 기준).",
        "숨이 차기보다 근육이 뻐근해지는 강도로 진행합니다.",
        "운동일 사이 하루는 휴식하여 회복을 확보합니다.",
      ],
      examples: [
        "스쿼트 10회 × 3세트",
        "런지 10회 × 2세트",
        "벽/무릎 푸쉬업 8회 × 2세트",
      ],
    },
    roi: {
      title: "이번 주 ROI 메시지",
      message:
        budgetLabel === "실속형"
          ? "추가 지출 없이도 근육을 지키면, 약물 효과가 끝난 뒤에도 체중이 흔들릴 때 다시 돌아올 기준이 생깁니다."
          : "지금의 단백질과 근력 루틴은 요요를 막는 근육 보험입니다. 체중보다 자본을 지키는 선택이 장기 비용을 줄입니다.",
    },
    nextWeek: {
      preview:
        args.risk === "높음"
          ? "다음 주도 Safe를 유지하고, 단백질 분할 섭취를 3~4회로 고정합니다."
          : "다음 주에는 활동량을 소폭 늘려(걸음 수 +20%) 유지력을 점검합니다.",
    },
  };
}

function balancedModeContent(args: { budget: BudgetTier }): Pick<WeeklyReport, "header" | "thisWeek" | "nutrition" | "training" | "roi" | "nextWeek"> {
  return {
    header: {
      title: "표준형 Balanced 모드",
      subtitle: "지치지 않는 지속 가능한 감량",
      coachIntro: "안정적인 궤도입니다. 무리하지 않고 습관을 단단하게 만드는 것이 이번 주의 핵심입니다.",
    },
    thisWeek: {
      summary: "근력과 유산소를 균형 있게 배치하고, 식사 순서와 수분 섭취를 고정합니다.",
      missions: [
        { label: "식사", detail: "채소 → 단백질 → 탄수화물 순서 고정" },
        { label: "운동", detail: "근력 2회 + 인터벌 걷기 2회(30분)" },
        { label: "생활", detail: "평소보다 활동량 20% 증가(계단/걷기)" },
      ],
    },
    nutrition: {
      title: "정밀 식단 가이드",
      bullets: [
        "끼니당 단백질 20g 이상 확보",
        "잡곡/귀리/곤약미 등으로 탄수화물을 전환합니다(반 공기 기준).",
        "저염 된장·청국장·김치 건더기 등 발효 식품을 활용합니다.",
      ],
      examples: ["잡곡밥 1/2공기 + 생선/두부", "샐러드 + 닭안심", "간식: 그릭요거트/삶은 계란"],
    },
    training: {
      title: "운동 가이드",
      bullets: [
        "근력은 전신 위주로 주 2회 고정합니다.",
        "유산소는 중강도 인터벌로 지방 연소 효율을 올립니다.",
      ],
      examples: ["전신 근력 20분", "인터벌 걷기 30분", "하루 7,000~9,000보"],
    },
    roi: {
      title: "이번 주 ROI 메시지",
      message: "속도보다 지속 가능성이 비용을 줄입니다. 안정적인 습관은 약물 중단 후에도 식욕 조절의 무기가 됩니다.",
    },
    nextWeek: {
      preview: "다음 주에는 체중의 주간 평균을 기준으로 변동을 해석하고, 필요 시 Safe로 전환합니다.",
    },
  };
}

function aggressiveModeContent(args: { budget: BudgetTier }): Pick<WeeklyReport, "header" | "thisWeek" | "nutrition" | "training" | "roi" | "nextWeek"> {
  return {
    header: {
      title: "집중형 Aggressive 모드",
      subtitle: "정체기 돌파용 단기 모드",
      coachIntro:
        "정체기를 깨기 위한 단기 모드입니다. 단, 몸의 신호(피로/메스꺼움/수면 악화)를 무시하지 마세요.",
    },
    thisWeek: {
      summary: "고강도 운동보다 NEAT(일상 활동량)를 올려 에너지 효율을 극대화합니다.",
      missions: [
        { label: "식사", detail: "단백질 비중 30~40% 유지" },
        { label: "운동", detail: "NEAT +30%(1만 보/서서 일하기/청소)" },
        { label: "유지", detail: "근력은 최소 주 1회로 근신호 유지" },
      ],
    },
    nutrition: {
      title: "정밀 식단 가이드",
      bullets: [
        "예산의 50%를 계란·냉동 닭안심·유청 단백질에 집중합니다.",
        "튀김·매운 음식·알코올을 제한해 위장 부작용 트리거를 차단합니다.",
        "곤약/양배추 등으로 볼륨을 키우되, 극단적 절식은 피합니다.",
      ],
      examples: ["계란 + 두부", "냉동 닭안심 샐러드", "양배추/곤약 볼륨식"],
    },
    training: {
      title: "운동 가이드",
      bullets: [
        "운동 시간을 늘리기보다 ‘종일 움직임’을 늘립니다.",
        "기력 저하가 느껴지면 즉시 Balanced로 복귀합니다.",
      ],
      examples: ["하루 10,000보", "짧은 산책 3회", "전신 근력 15분 1회"],
    },
    roi: {
      title: "이번 주 ROI 메시지",
      message: "속도를 내는 주간입니다. 다만 근육 자본을 잃으면 중단 후 비용이 더 커질 수 있으므로 단백질 우선 원칙은 유지합니다.",
    },
    nextWeek: {
      preview: "다음 주에는 피로감과 수면을 점검하고, 필요 시 Safe/Balanced로 전환합니다.",
    },
  };
}

export function buildWeeklyReport(args: {
  userData: UserData;
  analysis: AnalysisResult;
  // lastWeight가 있으면 주간 감량 속도를 정량화할 수 있습니다.
  lastWeight?: number | null;
  startBMI?: number | null;
}): WeeklyReport {
  const currentWeight = args.userData.currentWeight;
  const last = args.lastWeight ?? null;
  const weeklyLossPct =
    last != null && last > 0 ? clamp(((last - currentWeight) / last) * 100, -10, 10) : null;

  const { strategy, isExitMode } = decideStrategyType({
    drugStatus: args.userData.drugStatus,
    userAge: args.userData.userAge,
    currentWeek: args.userData.currentWeek,
    weeklyLossPct,
  });

  const muscleCapitalRisk = computeMuscleCapitalRisk({
    userAge: args.userData.userAge,
    startBMI: args.startBMI ?? null,
    muscleMass: args.userData.muscleMass,
    weeklyLossPct,
  });

  const common =
    strategy === "SAFE"
      ? safeModeContent({ budget: args.userData.budget, risk: muscleCapitalRisk, drugStatus: args.userData.drugStatus })
      : strategy === "BALANCED"
        ? balancedModeContent({ budget: args.userData.budget })
        : aggressiveModeContent({ budget: args.userData.budget });

  const stageTitle = args.analysis.stage?.title ? `현재 단계: ${args.analysis.stage.title}` : "";
  const subtitle = [stageTitle, common.header.subtitle].filter(Boolean).join(" · ");

  return {
    strategy,
    isExitMode,
    muscleCapitalRisk,
    ...common,
    header: {
      ...common.header,
      subtitle,
    },
  };
}
