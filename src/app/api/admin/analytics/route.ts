import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getAnalytics } from "@/lib/admin-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const data = await getAnalytics();
  return NextResponse.json(data, {
    status: data.ok ? 200 : data.status,
    headers: NO_STORE,
  });
}
