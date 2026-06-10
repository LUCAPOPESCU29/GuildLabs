import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_API = (process.env.BOT_API_URL || "http://localhost:3008").replace(/\/+$/, "");
const BOT_KEY = process.env.BOT_API_KEY || "forge-local-dev";
const NO_STORE = { "Cache-Control": "no-store" };

/** Owner-only: every server the bot was added to. Gated by OWNER_DISCORD_ID. */
export async function GET() {
  const session = await getSession();
  const owner = process.env.OWNER_DISCORD_ID;
  if (!session || !owner || session.id !== owner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE });
  }

  const botRes = await fetch(`${BOT_API}/guilds`, {
    headers: { "x-api-key": BOT_KEY },
    cache: "no-store",
  }).catch(() => null);
  if (!botRes || !botRes.ok) {
    return NextResponse.json({ error: "Bot is offline." }, { status: 503, headers: NO_STORE });
  }
  return NextResponse.json(await botRes.json().catch(() => []), { headers: NO_STORE });
}
