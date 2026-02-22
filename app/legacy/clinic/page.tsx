// app/legacy/clinic/page.tsx
// [LEGACY] 병원 대시보드 — 기본 네비게이션 제외, noindex 처리
import type { Metadata } from 'next';
import { Suspense } from 'react';
import ClinicDashboardClient from './ClinicDashboardClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: '[Legacy] Clinic Dashboard',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ClinicDashboardClient />
    </Suspense>
  );
}
