export type DrugType = "WEGOVY" | "MOUNJARO";
// PRE: 투약 전, ON: 투약 중, OFF: 투약 중단(최근)
export type DrugStatus = "PRE" | "ON" | "OFF";

export type BudgetTier = "실속형" | "표준형" | "집중형";
export type MuscleMassTier = "이하" | "표준" | "이상" | "모름";
export type ExerciseTier = "안 함" | "주 1회" | "주 1~2회" | "주 3회 이상";
export type MainConcern = "요요" | "근감소" | "부작용" | "비용" | "정체기" | "기타";

export interface UserData {
  userName?: string;
  userAge?: number;
  userGender?: "남성" | "여성";

  currentWeight: number;
  targetWeight: number;

  drugStatus: DrugStatus;
  drugType: DrugType;
  startWeightBeforeDrug?: number;

  currentDose?: string;
  currentWeek: number;
  startDate?: string;

  muscleMass: MuscleMassTier;
  exercise: ExerciseTier;
  budget: BudgetTier;

  mainConcern: MainConcern;
  resolution?: string;
}

export type StageKey = "ADAPT" | "LOSS" | "BRIDGE" | "MAINTAIN";

export interface StageInfo {
  key: StageKey;
  title: string;
  subtitle: string;
  message: string;
  color: string;
}

export interface AnalysisResult {
  stage: StageInfo;
  percentileText: string;
  headlineQuote: string;
  g: string;
  p: string;
  s: string;

  // UI에서 구간 표시/마커에 사용하는 메타
  userWeek: number;
  goalWeek: number;
  drugEndWeek: number;
  phases: Array<{
    key: StageKey;
    label: string; // 예: 적응기
    visualName: string; // 예: 몸의 변화 인지
    start: number;
    end: number;
    color: string;
    message: string;
  }>;

  // RoadmapChart 호환용 (과거 버전에서 사용)
  currentStage?: {
    start: number;
    end: number;
    name: string;
    color: string;
    msg: string;
  };

  chart: {
    weeks: number[];
    userSeries: number[];
    clinicalSeries: number[];
    lastValue: number;
    lastWeek: number;
  };

  // 임상 평균 대비 현재 위치(실제 체중 기반)
  userLossPctNow: number;
  expectedLossPctAtWeek: number;
  deltaVsAveragePp: number;
}

type Curve = { name: string; weeks: readonly number[]; values: readonly number[] };

const CLINICAL_DATA: Record<DrugType, Curve[]> = {
  WEGOVY: [
    { name: "위고비 2.4mg", weeks: [0, 4, 8, 12, 20, 36, 52, 72], values: [0, -2.2, -4, -6, -9.4, -13.3, -15.4, -16] },
  ],
  MOUNJARO: [
    { name: "터제타파이드 5mg", weeks: [0, 4, 8, 12, 20, 36, 52, 72], values: [0, -3, -6, -8, -11, -14, -15.5, -16] },
    { name: "터제타파이드 10mg", weeks: [0, 4, 8, 12, 20, 36, 52, 72], values: [0, -3.5, -6.5, -8.5, -11.5, -18, -20.5, -21.4] },
    { name: "터제타파이드 15mg", weeks: [0, 4, 8, 12, 20, 36, 52, 72], values: [0, -3.8, -7, -9, -12, -19, -21.5, -22.5] },
  ],
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function buildWeeklySeries(curve: { weeks: readonly number[]; values: readonly number[] }, horizon: number) {
  const out = new Array(horizon + 1).fill(0).map((_, i) => i);
  const values = out.map((w) => {
    if (w <= curve.weeks[0]) return curve.values[0];
    if (w >= curve.weeks[curve.weeks.length - 1]) return curve.values[curve.values.length - 1];

    for (let i = 0; i < curve.weeks.length - 1; i++) {
      const w0 = curve.weeks[i];
      const w1 = curve.weeks[i + 1];
      if (w >= w0 && w <= w1) {
        const t = (w - w0) / (w1 - w0);
        return lerp(curve.values[i], curve.values[i + 1], t);
      }
    }
    return curve.values[curve.values.length - 1];
  });

  return { weeks: out, values };
}

function pickClinicalCurve(drugType: DrugType, doseLabel?: string): Curve {
  const list = CLINICAL_DATA[drugType];
  if (drugType === "WEGOVY") return list[0];

  if (!doseLabel) return list[list.length - 1];

  const d = doseLabel.replace(/\s/g, "").toLowerCase();
  const has15 = d.includes("15");
  const has10 = d.includes("10");
  const has5 = d.includes("5");

  if (has15) return list.find((x) => x.name.includes("15")) ?? list[list.length - 1];
  if (has10) return list.find((x) => x.name.includes("10")) ?? list[list.length - 1];
  if (has5) return list.find((x) => x.name.includes("5")) ?? list[list.length - 1];

  return list[list.length - 1];
}

function computeStage(userWeek: number, remainingToGoalWeek: number, drugStatus: DrugStatus): StageInfo {
  if (drugStatus === "PRE") {
    return {
      key: "ADAPT",
      title: "준비의 시간",
      subtitle: "프리-브릿지",
      message: "투약 전 근육 저축이 투약 비용을 아낍니다.",
      color: "#F3F4F6",
    };
  }

  if (drugStatus === "OFF") {
    return {
      key: "MAINTAIN",
      title: "유지기",
      subtitle: "중단 후 골든타임",
      message: "중단 직후 4~8주는 요요 방어의 핵심 구간입니다.",
      color: "#EDE9FE",
    };
  }

  if (userWeek <= 4) {
    return {
      key: "ADAPT",
      title: "대사 적응",
      subtitle: "몸의 변화 인지",
      message: "몸이 변화를 받아들이는 중입니다. 무리하지 마세요.",
      color: "#DBEAFE",
    };
  }

  if (remainingToGoalWeek > 8) {
    return {
      key: "LOSS",
      title: "체지방 연소",
      subtitle: "감량기",
      message: "근육은 지키고 지방만 태우는 구간입니다.",
      color: "#D1FAE5",
    };
  }

  if (remainingToGoalWeek >= 0) {
    return {
      key: "BRIDGE",
      title: "대사 가교",
      subtitle: "가장 중요한 전환",
      message: "가장 중요한 시기! 자생 대사 엔진을 켭니다.",
      color: "#FEF3C7",
    };
  }

  return {
    key: "MAINTAIN",
    title: "유지기",
    subtitle: "요요 방어선 완성",
    message: "축하합니다! 건강한 대사 체계가 안착되도록 관리하세요.",
    color: "#EDE9FE",
  };
}

function estimateGoalWeek(currentWeight: number, targetWeight: number, avgWeeklyLossKg = 0.5) {
  const diff = Math.max(0, currentWeight - targetWeight);
  const weeks = diff / avgWeeklyLossKg;
  return Math.max(4, Math.ceil(weeks));
}

function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
}

function computeGoalWeekFromSeries(currentWeight: number, targetWeight: number, weeks: number[], userSeriesPct: number[]) {
  const len = Math.min(weeks.length, userSeriesPct.length);
  if (!len) return estimateGoalWeek(currentWeight, targetWeight);

  for (let i = 0; i < len; i++) {
    const w = weeks[i];
    const pct = userSeriesPct[i];
    const predicted = currentWeight * (1 + pct / 100);
    if (Number.isFinite(predicted) && predicted <= targetWeight) return Math.max(4, Math.floor(w));
  }

  // 도달하지 못하면 기존 추정치로
  return estimateGoalWeek(currentWeight, targetWeight);
}

function buildPhases(args: {
  drugStatus: DrugStatus;
  drugType: DrugType;
  budget: BudgetTier;
  userWeek: number;
  goalWeek: number;
  drugEndWeek: number;
}) {
  const { drugStatus, drugType, budget, userWeek, goalWeek, drugEndWeek } = args;

  // 기본: 투약 전이라도 구간 표시를 유지하되, 전환점은 userWeek 중심으로 최소한만 보여줌
  const bridgeStart = Math.max(0, goalWeek - 8);
  const lossEnd = Math.max(5, bridgeStart);
  const maintainEnd = drugEndWeek + 12;

  const drugLabel = drugType === "MOUNJARO" ? "터제타파이드" : "위고비";
  const vars = { drugType: drugLabel, budget };

 const templates = {
    ADAPT: "현재 {drugType}에 적응 중입니다. 수분과 단백질을 우선 고정해 부작용과 근손실을 함께 관리하세요.",
    LOSS:
      drugType === "MOUNJARO"
        ? "감량이 진행되는 구간입니다. 터제타파이드의 효과를 ‘근육 자본’으로 전환할 때입니다."
        : "감량이 진행되는 구간입니다. 위고비의 효과를 ‘근육 자본’으로 전환할 때입니다.",
    BRIDGE:
      "약효가 ‘사라지는’ 구간이 아니라 ‘변동하는’ 구간입니다. 특히 주사 주기 말에 일시적 저점이 반복될 수 있어, {budget} 전략에 맞춘 단백질·저항운동·수면 루틴이 핵심입니다.",
    MAINTAIN:
      "이제부터는 약물이 아니라 근육 자본과 생활 루틴이 체중을 지탱합니다. 중단 후에도 유지되는 패턴을 고정하세요."
  } as const;

  const phases = [
    {
      key: "ADAPT" as const,
      label: "적응기",
      visualName: "초기 적응과 안정화",
      start: 0,
      end: 4,
      color: "#3B82F6",
      message: fillTemplate(templates.ADAPT, vars),
    },
    {
      key: "LOSS" as const,
      label: "감량기",
      visualName: "감량 흐름 확보",
      start: 5,
      end: lossEnd,
      color: "#10B981",
      message: fillTemplate(templates.LOSS, vars),
    },
    {
      key: "BRIDGE" as const,
      label: "가교기",
      visualName: "전환 구간: 말기 저점 관리",
      start: bridgeStart,
      end: drugEndWeek,
      color: "#F59E0B",
      message: fillTemplate(templates.BRIDGE, vars),
    },
    {
      key: "MAINTAIN" as const,
      label: "유지기",
      visualName: "근육 자본이 체중을 지탱",
      start: drugEndWeek,
      end: maintainEnd,
      color: "#8B5CF6",
      message: fillTemplate(templates.MAINTAIN, vars),
    },
  ];

  // 투약 전이면 가교/유지 표시가 과도할 수 있어, chart 길이에 맞춰서 최소 범위를 보장
  if (drugStatus === "PRE") {
    // 목표 주차를 userWeek 기준으로만 좁혀 UI가 과장되지 않게
    const preGoal = Math.max(4, Math.ceil(userWeek + 12));
    const preBridgeStart = Math.max(0, preGoal - 8);
    phases[1].end = Math.max(5, preBridgeStart);
    phases[2].start = preBridgeStart;
    phases[2].end = preGoal;
    phases[3].start = preGoal;
    phases[3].end = preGoal + 12;
  }

  return phases;
}

function computeCompareText(drugType: DrugType, deltaVsAveragePp: number): string {
  const label = drugType === "MOUNJARO" ? "마운자로" : "위고비";
  const abs = Math.abs(deltaVsAveragePp);
  const v = Number.isFinite(abs) ? abs : 0;
  const txt = deltaVsAveragePp < 0 ? "아래" : "위";
  return `동일 주차 기준, ${label} 평균 대비 ${v.toFixed(0)}%p ${txt}`;
}

function computeHeadlineQuote(stageKey: StageKey, drugType: DrugType): string {
  if (stageKey === "ADAPT") return `현재 ${drugType === "MOUNJARO" ? "터제타파이드" : "위고비"}에 적응 중입니다. 수분 2L 섭취로 부작용을 관리하세요.`;
  if (stageKey === "LOSS") return "감량 속도가 빠릅니다. 감량 효과를 근육 자산으로 전환할 때입니다.";
  if (stageKey === "BRIDGE") return "약물 농도가 낮아집니다. 예산 전략에 따른 저항성 운동이 핵심입니다!";
  return "이제 스스로 에너지를 태우는 대사 체계가 안착되도록 유지 전략을 이어가세요.";
}

export function generatePersonalizedAnalysis(userData: UserData): AnalysisResult {
  const userWeek = Math.max(0, Math.floor(userData.currentWeek || 0));

  const drugLabel = userData.drugType === "MOUNJARO" ? "터제타파이드" : "위고비";
  const dose = userData.currentDose ? `${userData.currentDose}` : "0mg";
  const g = `${drugLabel} ${dose}`;

  const p = userData.budget === "실속형" ? "단백질 100g/day" : userData.budget === "표준형" ? "HMB 3g + 유청 단백질" : "HMB + Creatine + 고단백";
  const s = userData.exercise === "안 함" ? "안 함" : userData.exercise;

  const clinicalCurve = pickClinicalCurve(userData.drugType, userData.currentDose);
  const horizonBase = Math.max(72, userWeek);
  const clinicalWeekly = buildWeeklySeries(clinicalCurve, Math.min(horizonBase, 72));

  // 72주 이후는 72주 값을 유지
  const weeks: number[] = [];
  const clinicalSeries: number[] = [];
  for (let w = 0; w <= horizonBase; w++) {
    weeks.push(w);
    if (w <= 72) clinicalSeries.push(clinicalWeekly.values[w]);
    else clinicalSeries.push(clinicalWeekly.values[72]);
  }

  // 사용자 예측은 임상 평균 기반으로, 근육/운동/예산에 따른 작은 보정
  const adjMuscle = userData.muscleMass === "이하" ? 0.92 : userData.muscleMass === "이상" ? 1.04 : 1.0;
  const adjExercise = userData.exercise === "주 3회 이상" ? 1.06 : userData.exercise === "주 1~2회" ? 1.03 : 1.0;
  const adjBudget = userData.budget === "집중형" ? 1.05 : userData.budget === "표준형" ? 1.02 : 0.98;

  const userSeries = clinicalSeries.map((v) => v * adjMuscle * adjExercise * adjBudget);

  // 사용자 현재 위치(dot): 실제 체중 기반
  // ON일 때 startWeightBeforeDrug가 보장된다는 전제(온보딩/결과 페이지에서 검증)
  const startWeight =
    userData.drugStatus === "ON" && typeof userData.startWeightBeforeDrug === "number" && userData.startWeightBeforeDrug > 0
      ? userData.startWeightBeforeDrug
      : userData.currentWeight;
  const userLossPctNow = ((userData.currentWeight - startWeight) / startWeight) * 100;

  // 동일 주차 임상 평균(기준선)
  const expectedLossPctAtWeek = clinicalSeries[Math.min(userWeek, clinicalSeries.length - 1)] ?? 0;
  const deltaVsAveragePp = userLossPctNow - expectedLossPctAtWeek;
  const percentileText = computeCompareText(userData.drugType, deltaVsAveragePp);

  // 목표 도달 주차를 예측 곡선 기반으로 산출
  const goalWeek = computeGoalWeekFromSeries(userData.currentWeight, userData.targetWeight, weeks, userSeries);

  // 기본 가정: 목표 도달 시점에 투약 종료 (온보딩에 별도 값이 없으므로)
  const drugEndWeek = Math.max(userWeek, goalWeek);

  // 구간을 포함하도록 차트 길이를 늘림 (유지기 +12주까지)
  const horizon = Math.max(horizonBase, drugEndWeek + 12);
  if (horizon > horizonBase) {
    for (let w = horizonBase + 1; w <= horizon; w++) {
      weeks.push(w);
      // 72주 이후는 임상값 고정
      const baseClinical = w <= 72 ? clinicalWeekly.values[w] : clinicalWeekly.values[72];
      clinicalSeries.push(baseClinical);
      userSeries.push(baseClinical * adjMuscle * adjExercise * adjBudget);
    }
  }

  const remainingToGoalWeek = Math.max(0, goalWeek - userWeek);
  const stage = computeStage(userWeek, remainingToGoalWeek, userData.drugStatus);

  const lastWeek = weeks[weeks.length - 1];
  const lastValue = userSeries[userSeries.length - 1];

  const phases = buildPhases({
    drugStatus: userData.drugStatus,
    drugType: userData.drugType,
    budget: userData.budget,
    userWeek,
    goalWeek,
    drugEndWeek,
  });

  // 현재 주차가 속한 구간을 currentStage로 제공 (RoadmapChart 하이라이트 호환)
  const currentPhase = phases.find((p) => userWeek >= p.start && userWeek <= p.end) || phases[0];

  return {
    stage,
    percentileText,
    headlineQuote: computeHeadlineQuote(stage.key, userData.drugType),
    g,
    p,
    s,
    userWeek,
    goalWeek,
    drugEndWeek,
    phases,
    currentStage: {
      start: currentPhase.start,
      end: currentPhase.end,
      name: currentPhase.label,
      color: currentPhase.color,
      msg: currentPhase.message,
    },
    chart: {
      weeks,
      userSeries,
      clinicalSeries,
      lastValue,
      lastWeek,
    },

    userLossPctNow,
    expectedLossPctAtWeek,
    deltaVsAveragePp,
  };
}
