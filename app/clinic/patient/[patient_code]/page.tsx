// app/clinic/patient/[patient_code]/page.tsx
// Legacy 경로 — /legacy/clinic 으로 리디렉션
import { redirect } from 'next/navigation';

export default async function PatientRedirect({
  params,
}: {
  params: Promise<{ patient_code: string }>;
}) {
  const { patient_code } = await params;
  redirect(`/legacy/clinic/patient/${patient_code}`);
}
