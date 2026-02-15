// /lib/drug-config.ts
// 기준: (Next Weight Lab) 대사 가교 전략 및 ROI 마스터 시트.pdf

export type DrugTypeKey = 'MOUNJARO' | 'WEGOVY';

export const DRUG_TYPES: Record<DrugTypeKey, { name: string; steps: number[]; unit: string }> = {
  MOUNJARO: { name: '터제타파이드', steps: [2.5, 5, 7.5, 10, 12.5, 15], unit: 'mg' },
  WEGOVY: { name: '위고비', steps: [0.25, 0.5, 1.0, 1.7, 2.4], unit: 'mg' },
};

export type BudgetTier = '실속형' | '표준형' | '집중형';

export type StagePhase = 'adaptation' | 'loss' | 'bridge' | 'maintenance';

export type StageDef = {
  phase: StagePhase;
  name: string;
  icon: string;
  color: string;
  // start/end는 “표시용 기본값”
  // 실제 단계 판정은 roadmap-engine에서 goal/stop 기준으로 동적으로 계산됨
  start: number;
  end: number;
  msgTemplate: string;
};

export const STAGES: StageDef[] = [
  {
    phase: 'adaptation',
    name: '적응기',
    icon: '💧',
    color: '#3B82F6',
    start: 0,
    end: 4,
    msgTemplate: '현재 {drugType} 에 적응 중입니다. 수분 2L 섭취로 부작용을 관리하세요.',
  },
  {
    phase: 'loss',
    name: '감량기',
    icon: '🔥',
    color: '#10B981',
    start: 5,
    end: 16,
    msgTemplate: '감량 속도가 빠릅니다. 터제타파이드의 효과를 근육 자산으로 전환할 때입니다.',
  },
  {
    phase: 'bridge',
    name: '가교기',
    icon: '🌉',
    color: '#F59E0B',
    start: 17,
    end: 36,
    msgTemplate: '약물 농도가 낮아집니다. {budget} 전략에 따른 저항성 운동이 핵심입니다!',
  },
  {
    phase: 'maintenance',
    name: '유지기',
    icon: '🛡️',
    color: '#8B5CF6',
    start: 37,
    end: 49,
    msgTemplate: '축하합니다! 이제 스스로 에너지를 태우는 건강한 대사 체계가 안착되었습니다.',
  },
];

export const CLINICAL_DATA = {
  // 표: 주차(Week) - 위약 / 위고비 2.4 / 터제타파이드 5/10/15
  PLACEBO: {
    name: '위약',
    weeks: [0, 4, 8, 12, 20, 36, 52, 72],
    values: [0, -1, -1.6, -2, -2.7, -3, -3.2, -2.4],
  } as const,
  WEGOVY_24: {
    name: '위고비 2.4mg',
    weeks: [0, 4, 8, 12, 20, 36, 52, 72],
    values: [0, -2.2, -4, -6, -9.4, -13.3, -15.4, -16.0],
  } as const,
  MOUNJARO_5: {
    name: '터제타파이드 5mg',
    weeks: [0, 4, 8, 12, 20, 36, 52, 72],
    values: [0, -3, -6, -8, -11, -14, -15.5, -16],
  } as const,
  MOUNJARO_10: {
    name: '터제타파이드 10mg',
    weeks: [0, 4, 8, 12, 20, 36, 52, 72],
    values: [0, -3.5, -6.5, -8.5, -11.5, -18, -20.5, -21.4],
  } as const,
  MOUNJARO_15: {
    name: '터제타파이드 15mg',
    weeks: [0, 4, 8, 12, 20, 36, 52, 72],
    values: [0, -3.8, -7, -9, -12, -19, -21.5, -22.5],
  } as const,
};
