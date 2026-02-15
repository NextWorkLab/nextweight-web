import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const q = String(form.get("q") || "");

  const res = NextResponse.redirect(new URL(`/report/print?${q}`, req.url));
  res.cookies.set("nw_pdf_free_used", "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 365, // 1년
  });
  return res;
}
