// /lib/content.ts

export const SIDE_EFFECT_GUIDE = {
  NAUSEA: {
    title: "오심/구토 케어",
    check: "한 끼 양이 평소보다 많았나요?",
    action: "소량씩 5~6회로 나누어 드시고, 고지방식은 피하십시오.",
    ref: "대한비만학회 비만 진료지침 2024"
  },
  CONSTIPATION: {
    title: "변비 케어",
    check: "식이섬유와 수분이 부족하지 않나요?",
    action: "충분한 수분 섭취와 함께 매일 20분 이상 걷기를 권장합니다.",
    ref: "대한비만학회 비만 진료지침 2024"
  }
};

export const PROTEIN_20G_GUIDE = [
  { name: "살코기/닭고기", weight: "100g (손바닥 크기)" },
  { name: "생선", weight: "130g (중간 2토막)" },
  { name: "달걀", weight: "140g (왕란 2개)" },
  { name: "두부", weight: "200g (2/3모)" },
  { name: "검정콩/대두", weight: "50g (5큰술)" }
];

export const MEDICAL_RULES = {
  FIVE_PERCENT_RULE: {
    title: "전문가 체크포인트 (5% 규칙)",
    content: "유지 용량 투여 후 3개월 내에 5% 이상의 체중 감량이 없다면 약제 변경이나 중단을 고려해야 합니다.",
    ref: "진료지침 111p"
  }
};

export const HMB_GUIDE_CONTENT = {
  title: "근육 사수를 위한 HMB 가이드",
  description: "급격한 감량 시 근단백질 분해를 억제하는 핵심 전략입니다.",
  benefits: ["근손실 방어", "대사율 유지", "요요 방지"],
  usage: "하루 3g 분할 섭취"
};
