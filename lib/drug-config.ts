// /lib/drug-config.ts

export const DRUG_METRICS = {
  SEMAGLUTIDE: {
    name: "세마글루타이드",
    originalBrands: ["위고비", "오젬픽"],
    steps: [0.25, 0.5, 1.0, 1.7, 2.4],
    maintenanceDose: 1.0, // 유지기 핵심 용량
    unit: "mg",
    halfLife: "7 days"
  },
  TIRZEPATIDE: {
    name: "터제타파이드", // 사용자 지정 번역 반영
    originalBrands: ["마운자로", "젭바운드"],
    steps: [2.5, 5, 7.5, 10, 12.5, 15],
    maintenanceDose: 5.0, // 유지기 핵심 용량
    unit: "mg",
    halfLife: "5 days"
  }
};
