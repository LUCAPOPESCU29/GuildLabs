/**
 * Invite lookup for the admin dashboard.
 *
 * READ-ONLY BY DESIGN. This fetches invites a server's own staff already
 * created; it never calls POST /channels/{id}/invites. Minting invites across
 * servers we don't own would write to dozens of third-party audit logs and
 * create permanent entry points their owners never asked for — a very different
 * act from reading what's already there.
 *
 * Runs as a separate endpoint from the main analytics because it costs one
 * request per guild and is slow enough to want an explicit trigger.
 */

import "server-only";

const API = "https://discord.com/api/v10";
const CONCURRENCY = 5;

export type GuildInvite = {
  guildId: string;
  code: string | null;
  url: string | null;
  /** How the link was obtained — vanity URLs are the server's own branding. */
  kind: "vanity" | "existing" | null;
  uses: number | null;
  neverExpires: boolean;
  totalInvites: number;
  error?: string;
};

type RawInvite = {
  code: string;
  uses?: number;
  max_age?: number;
  created_at?: string;
};

async function discord(path: string, token: string): Promise<Response> {
  return fetch(`${API}${path}`, {
    headers: { Authorization: `Bot ${token}` },
    cache: "no-store",
  });
}

/** One request, retrying once when Discord asks us to back off. */
async function getJson(path: string, token: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  let res = await discord(path, token);
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after") ?? "1");
    await new Promise((r) => setTimeout(r, Math.min(5000, retry * 1000 + 100)));
    res = await discord(path, token);
  }
  return { ok: res.ok, status: res.status, data: res.ok ? await res.json().catch(() => null) : null };
}

/**
 * Rank invites so the dashboard surfaces the most useful one: a link that
 * never expires beats one that does, and among equals the most-used link is
 * the server's real front door rather than a one-off.
 */
function pickBest(invites: RawInvite[]): RawInvite | null {
  if (!invites.length) return null;
  return [...invites].sort((a, b) => {
    const aPerm = (a.max_age ?? 0) === 0 ? 1 : 0;
    const bPerm = (b.max_age ?? 0) === 0 ? 1 : 0;
    if (aPerm !== bPerm) return bPerm - aPerm;
    if ((b.max_age ?? 0) !== (a.max_age ?? 0)) return (b.max_age ?? 0) - (a.max_age ?? 0);
    return (b.uses ?? 0) - (a.uses ?? 0);
  })[0];
}

async function forGuild(guildId: string, token: string): Promise<GuildInvite> {
  const base: GuildInvite = {
    guildId, code: null, url: null, kind: null, uses: null,
    neverExpires: false, totalInvites: 0,
  };

  // A vanity URL is the server's own canonical link — prefer it when present.
  const guild = await getJson(`/guilds/${guildId}`, token);
  if (guild.ok) {
    const vanity = (guild.data as { vanity_url_code?: string | null })?.vanity_url_code;
    if (vanity) {
      return { ...base, code: vanity, url: `https://discord.gg/${vanity}`, kind: "vanity", neverExpires: true, totalInvites: 1 };
    }
  }

  const res = await getJson(`/guilds/${guildId}/invites`, token);
  if (!res.ok) {
    return { ...base, error: res.status === 403 ? "No Manage Server permission" : `Discord ${res.status}` };
  }

  const invites = (res.data as RawInvite[]) ?? [];
  const best = pickBest(invites);
  if (!best) return { ...base, error: "No invites exist in this server" };

  return {
    ...base,
    code: best.code,
    url: `https://discord.gg/${best.code}`,
    kind: "existing",
    uses: best.uses ?? null,
    neverExpires: (best.max_age ?? 0) === 0,
    totalInvites: invites.length,
  };
}

/** Fetch invites for many guilds with a bounded worker pool. */
export async function getInvites(guildIds: string[]): Promise<
  { ok: true; invites: GuildInvite[] } | { ok: false; error: string; status: number }
> {
  const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  if (!token) return { ok: false, status: 500, error: "DISCORD_BOT_TOKEN is not set on the server." };

  const ids = guildIds.slice(0, 250);
  const out: GuildInvite[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < ids.length) {
      const i = cursor++;
      try {
        out[i] = await forGuild(ids[i], token!);
      } catch (e) {
        out[i] = {
          guildId: ids[i], code: null, url: null, kind: null, uses: null,
          neverExpires: false, totalInvites: 0, error: (e as Error).message,
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker));
  return { ok: true, invites: out };
}
