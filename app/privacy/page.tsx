// app/privacy/page.tsx — /legal/privacy 로 리디렉션
import { redirect } from "next/navigation";
export default function PrivacyRedirect() {
  redirect("/legal/privacy");
}
