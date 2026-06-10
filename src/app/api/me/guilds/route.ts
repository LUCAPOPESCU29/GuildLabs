import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_API = (process.env.BOT_API_URL || "http://localhost:3008").replace(/\/+$/, "");
const BOT_KEY = process.env.BOT_API_KEY || "forge-local-dev";
const NO_STORE = { "Cache-Control": "no-store" };

// Discord permission bits (BigInt ctor — tsconfig target is < ES2020, so no `n` literals)
const ADMINISTRATOR = BigInt(0x8);
const MANAGE_GUILD = BigInt(0x20);
const ZERO = BigInt(0);

/**
 * Servers the signed-in user can manage AND the bot is in. This is what the
 * dashboard should show — never the bot's full guild list (which would leak
 * every server the bot was added to, to anyone who signs in).
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: NO_STORE });
  }

  // 1. Which guilds does THIS user manage? (needs the `guilds` OAuth scope)
  const manageable = new Set<string>();
  try {
    const r = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (r.ok) {
      const gs = await r.json();
      if (Array.isArray(gs)) {
        for (const g of gs) {
          try {
            const perms = BigInt(g.permissions ?? "0");
            if (g.owner || (perms & (ADMINISTRATOR | MANAGE_GUILD)) !== ZERO) manageable.add(g.id);
          } catch {
            /* skip malformed permission strings */
          }
        }
      }
    }
  } catch {
    /* Discord unreachable — fall through to empty intersection */
  }

  // 2. Which guilds is the bot in?
  const botRes = await fetch(`${BOT_API}/guilds`, {
    headers: { "x-api-key": BOT_KEY },
    cache: "no-store",
  }).catch(() => null);
  if (!botRes || !botRes.ok) {
    return NextResponse.json({ error: "Bot is offline." }, { status: 503, headers: NO_STORE });
  }
  const botGuilds = await botRes.json().catch(() => []);

  // 3. Intersection — only servers the user manages.
  const out = Array.isArray(botGuilds)
    ? botGuilds.filter((g: { id: string }) => manageable.has(g.id))
    : [];
  return NextResponse.json(out, { headers: NO_STORE });
}
