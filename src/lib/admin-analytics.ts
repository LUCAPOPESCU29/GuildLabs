/**
 * Server analytics for the admin dashboard.
 *
 * Reads straight from Discord's REST API with the bot token rather than from the
 * bot's own HTTP server, because the bot runs on a local machine with no public
 * URL — Vercel could never reach it. This way the dashboard works in production
 * whether or not the bot process happens to be running.
 */

import "server-only";

const API = "https://discord.com/api/v10";
const DISCORD_EPOCH = BigInt("1420070400000");

export type Guild = {
  id: string;
  name: string;
  icon: string | null;
  iconUrl: string | null;
  owner: boolean;
  memberCount: number;
  onlineCount: number;
  createdAt: string;
  ageDays: number;
  features: string[];
  isCommunity: boolean;
  isVerified: boolean;
  isPartnered: boolean;
  hasAdmin: boolean;
};

export type Analytics = {
  ok: true;
  bot: { id: string; username: string; avatarUrl: string | null };
  totals: {
    servers: number;
    members: number;
    online: number;
    largest: number;
    median: number;
    community: number;
    verified: number;
    partnered: number;
    adminGrants: number;
  };
  distribution: { label: string; count: number }[];
  byMonth: { month: string; count: number }[];
  guilds: Guild[];
  fetchedAt: string;
};

export type AnalyticsError = { ok: false; error: string; status: number };

/** Discord snowflakes embed their creation time in the high bits. */
function snowflakeDate(id: string): Date {
  return new Date(Number((BigInt(id) >> BigInt(22)) + DISCORD_EPOCH));
}

const ADMINISTRATOR = BigInt(8); // PermissionFlagsBits.Administrator

async function discord(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bot ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw Object.assign(new Error(`Discord ${res.status}: ${body.slice(0, 160)}`), {
      status: res.status,
    });
  }
  return res.json();
}

function bucket(n: number): string {
  if (n < 10) return "< 10";
  if (n < 50) return "10 – 49";
  if (n < 200) return "50 – 199";
  if (n < 1000) return "200 – 999";
  if (n < 5000) return "1k – 5k";
  return "5k+";
}
const BUCKETS = ["< 10", "10 – 49", "50 – 199", "200 – 999", "1k – 5k", "5k+"];

export async function getAnalytics(): Promise<Analytics | AnalyticsError> {
  const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  if (!token) {
    return { ok: false, status: 500, error: "DISCORD_BOT_TOKEN is not set on the server." };
  }

  try {
    const me = await discord("/users/@me", token);

    // Paginate — the endpoint caps at 200 per page.
    const raw: Record<string, unknown>[] = [];
    let after: string | undefined;
    for (let page = 0; page < 25; page++) {
      const qs = new URLSearchParams({ limit: "200", with_counts: "true" });
      if (after) qs.set("after", after);
      const batch = (await discord(`/users/@me/guilds?${qs}`, token)) as Record<string, unknown>[];
      raw.push(...batch);
      if (batch.length < 200) break;
      after = batch[batch.length - 1].id as string;
    }

    const now = Date.now();
    const guilds: Guild[] = raw
      .map((g) => {
        const id = String(g.id);
        const created = snowflakeDate(id);
        const features = (g.features as string[]) ?? [];
        const perms = BigInt((g.permissions as string) ?? "0");
        const icon = (g.icon as string | null) ?? null;
        return {
          id,
          name: String(g.name ?? "Unknown"),
          icon,
          iconUrl: icon
            ? `https://cdn.discordapp.com/icons/${id}/${icon}.${icon.startsWith("a_") ? "gif" : "png"}?size=64`
            : null,
          owner: !!g.owner,
          memberCount: Number(g.approximate_member_count ?? 0),
          onlineCount: Number(g.approximate_presence_count ?? 0),
          createdAt: created.toISOString(),
          ageDays: Math.max(0, Math.floor((now - created.getTime()) / 86_400_000)),
          features,
          isCommunity: features.includes("COMMUNITY"),
          isVerified: features.includes("VERIFIED"),
          isPartnered: features.includes("PARTNERED"),
          hasAdmin: (perms & ADMINISTRATOR) === ADMINISTRATOR,
        };
      })
      .sort((a, b) => b.memberCount - a.memberCount);

    const sizes = guilds.map((g) => g.memberCount).sort((a, b) => a - b);
    const median = sizes.length
      ? sizes.length % 2
        ? sizes[(sizes.length - 1) / 2]
        : Math.round((sizes[sizes.length / 2 - 1] + sizes[sizes.length / 2]) / 2)
      : 0;

    const distCount = new Map<string, number>(BUCKETS.map((b) => [b, 0]));
    guilds.forEach((g) => distCount.set(bucket(g.memberCount), (distCount.get(bucket(g.memberCount)) ?? 0) + 1));

    // Group by the month each server was created — a proxy for install cohorts,
    // since most servers install a bot soon after being made.
    const months = new Map<string, number>();
    guilds.forEach((g) => {
      const m = g.createdAt.slice(0, 7);
      months.set(m, (months.get(m) ?? 0) + 1);
    });

    return {
      ok: true,
      bot: {
        id: String(me.id),
        username: String(me.username),
        avatarUrl: me.avatar
          ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=128`
          : null,
      },
      totals: {
        servers: guilds.length,
        members: guilds.reduce((n, g) => n + g.memberCount, 0),
        online: guilds.reduce((n, g) => n + g.onlineCount, 0),
        largest: sizes.length ? sizes[sizes.length - 1] : 0,
        median,
        community: guilds.filter((g) => g.isCommunity).length,
        verified: guilds.filter((g) => g.isVerified).length,
        partnered: guilds.filter((g) => g.isPartnered).length,
        adminGrants: guilds.filter((g) => g.hasAdmin).length,
      },
      distribution: BUCKETS.map((label) => ({ label, count: distCount.get(label) ?? 0 })),
      byMonth: [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
      guilds,
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502;
    return {
      ok: false,
      status,
      error:
        status === 401
          ? "Discord rejected the bot token (401). Check DISCORD_BOT_TOKEN."
          : `Couldn't reach Discord. ${(e as Error).message}`,
    };
  }
}
