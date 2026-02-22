// app/clinic/page.tsx
// Legacy 경로 — /legacy/clinic 으로 리디렉션
import { redirect } from 'next/navigation';

export default function ClinicRedirect() {
  redirect('/legacy/clinic');
}
