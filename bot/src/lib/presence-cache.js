/**
 * Presence cache — approximate member/online counts per guild.
 *
 * The gateway doesn't carry presence counts; only the REST endpoint
 * (`GET /guilds/:id?with_counts=true`) does. Refreshing all guilds is ~100ms
 * of rate-limit-friendly calls per 300ms gap, so we do it in the background
 * once an hour (and shortly after boot) and serve cached values from
 * GET /guilds — the dashboard gets real online numbers without waiting.
 */

const cache = new Map(); // guildId → { members, online, at }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function getPresence(guildId) {
  return cache.get(guildId) ?? null;
}

export function startPresenceRefresh(client) {
  if (startPresenceRefresh.started) return;
  startPresenceRefresh.started = true;

  async function tick() {
    let fresh = 0;
    for (const guild of client.guilds.cache.values()) {
      try {
        const full = await client.guilds.fetch({
          guild: guild.id,
          withCounts: true,
          force: true,
        });
        cache.set(guild.id, {
          members: full.approximateMemberCount ?? full.memberCount ?? 0,
          online: full.approximatePresenceCount ?? 0,
          at: Date.now(),
        });
        fresh++;
      } catch {
        // Guild gone unavailable or deleted — keep last known values.
      }
      await sleep(300);
    }
    if (fresh) console.log(`[PRESENCE] Refreshed counts for ${fresh} guild(s)`);
  }

  setTimeout(tick, 10_000).unref?.();
  setInterval(tick, 60 * 60_000).unref?.();
}
