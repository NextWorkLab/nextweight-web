// app/api/auth/logout/route.ts

import { NextResponse } from "next/server";
import { makeSetCookieHeader } from "@/lib/session";

export async function POST() {
  const clearCookie = makeSetCookieHeader("", true);
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clearCookie } });
}
