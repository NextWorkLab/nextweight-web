// /lib/roadmap-engine.ts
import { DRUG_METRICS } from './drug-config';

export interface UserInput {
  drugType: 'SEMAGLUTIDE' | 'TIRZEPATIDE';
  gender: 'male' | 'female';
  age: number;
  currentWeight: number;
  muscleStatus: 'normal' | 'low'; // 안단테핏 데이터 연동 대비
}

export const generateNextWeightRoadmap = (input: UserInput) => {
  const config = DRUG_METRICS[input.drugType];
  
  // 1. 증량 주기(Titration Interval) 결정
  // 논리적 근거: 고령자는 위장관계 부작용 민감도가 높으므로 적응 기간을 1.5배 연장
  const weekInterval = input.age >= 65 ? 6 : 4;

  // 2. 주차별 로드맵 생성
  const schedule = config.steps.map((dose, index) => {
    const startWeek = index * weekInterval + 1;
    const isMaintenancePhase = dose <= config.maintenanceDose;

    return {
      week: startWeek,
      dose: `${dose}${config.unit}`,
      phase: isMaintenancePhase ? 'Maintenance (유지기)' : 'Titration (증량기)',
      // 유지기 진입 시 'Metabolic Bridge' 전략 적용
      strategy: isMaintenancePhase 
        ? "대사 안정화 및 근육 보존 집중" 
        : "신체 적응 및 체지방 감량 집중",
      supplements: isMaintenancePhase 
        ? ["HMB 3g (필수)", "베르베린", "수용성 식이섬유"] 
        : ["고단백 식단", "멀티비타민"]
    };
  });

  return {
    drugName: config.name,
    roadmap: schedule,
    totalDuration: schedule[schedule.length - 1].week + weekInterval - 1,
    disclaimer: "본 가이드는 학술 데이터를 기반으로 한 참고용이며, 실제 투여는 의사의 처방에 따라야 합니다."
  };
};
