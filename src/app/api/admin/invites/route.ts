import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getInvites } from "@/lib/admin-invites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // one request per guild adds up

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.guildIds) ? body.guildIds.map(String) : [];
  if (!ids.length) {
    return NextResponse.json({ error: "guildIds required" }, { status: 400, headers: NO_STORE });
  }
  const result = await getInvites(ids);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status, headers: NO_STORE });
}
