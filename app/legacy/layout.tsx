// app/legacy/layout.tsx
// Legacy 레이아웃 — noindex 메타 태그 공통 적용
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ display: "none" }} aria-hidden>legacy</div>
      {children}
    </>
  );
}
