import { NextResponse } from "next/server";

// Live health — never cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type BotStatus = "operational" | "degraded" | "down" | "unknown";

type BotCheck = {
  slug: string;
  name: string;
  status: BotStatus;
  latencyMs: number | null;
};

/**
 * Each bot exposes a health endpoint (ChartIt: GET /health → {ok, bot}). URLs
 * are env-configured; an unset URL yields "unknown" rather than a false "down",
 * which keeps the page honest in environments where a bot isn't wired up.
 */
const BOTS: { slug: string; name: string; url?: string }[] = [
  { slug: "chartit", name: "ChartIt", url: process.env.CHARTIT_HEALTH_URL },
  {
    slug: "construct",
    name: "Construct",
    url: process.env.CONSTRUCT_HEALTH_URL || (process.env.BOT_API_URL ? `${process.env.BOT_API_URL}/health` : undefined),
  },
  { slug: "maven", name: "Maven", url: process.env.MAVEN_HEALTH_URL },
];

const TIMEOUT_MS = 4000;

async function check(bot: { slug: string; name: string; url?: string }): Promise<BotCheck> {
  if (!bot.url) {
    return { slug: bot.slug, name: bot.name, status: "unknown", latencyMs: null };
  }
  const startedAt = Date.now();
  try {
    const res = await fetch(bot.url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const latencyMs = Date.now() - startedAt;
    if (!res.ok) {
      return { slug: bot.slug, name: bot.name, status: "degraded", latencyMs };
    }
    // ChartIt-style payload is { ok: true }; tolerate non-JSON 200s as operational.
    const body = await res.json().catch(() => ({}));
    const ok = body?.ok !== false;
    return { slug: bot.slug, name: bot.name, status: ok ? "operational" : "degraded", latencyMs };
  } catch {
    return { slug: bot.slug, name: bot.name, status: "down", latencyMs: null };
  }
}

export async function GET() {
  const bots = await Promise.all(BOTS.map(check));
  return NextResponse.json(
    { checkedAt: new Date().toISOString(), bots },
    { headers: { "Cache-Control": "no-store" } }
  );
}
