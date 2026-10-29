import { NextRequest, NextResponse } from "next/server";
import { passwordMatches, createAdminToken, ADMIN_COOKIE, adminCookieOptions } from "@/lib/admin-auth";
import { rateLimit, clientIp, sweepExpired } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  sweepExpired();
  // A short password needs brute-force protection more than a long one does.
  const limit = rateLimit(`admin-login:${clientIp(req)}`, 6, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts — wait a minute." },
      { status: 429, headers: NO_STORE }
    );
  }

  const body = await req.json().catch(() => null);
  if (!(await passwordMatches(body?.password))) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401, headers: NO_STORE });
  }

  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  res.cookies.set(ADMIN_COOKIE, await createAdminToken(), adminCookieOptions());
  return res;
}
