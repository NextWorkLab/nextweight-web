// app/clinic/page.tsx
import { Suspense } from 'react';
import ClinicDashboardClient from './ClinicDashboardClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ClinicDashboardClient />
    </Suspense>
  );
}
