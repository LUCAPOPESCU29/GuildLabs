import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { dayOf } from "../lib/store.js";
import { fetchCounts, fetchUpcomingEvents, fetchInviteUses, guildVisuals } from "../lib/discord-data.js";

const RESAMPLE_MS = 6 * 60 * 60_000; // per-guild cadence from the hourly tick
const LAZY_MS = 10 * 60_000; // page-view-triggered refresh, at most this often

const lastSampled = new Map(); // guildId → timestamp
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Take one sample for a guild: counts, upcoming events, invite uses, and a
 * refresh of the cached name/icon/banner. Safe to call repeatedly — the
 * store keeps the day's latest members and peak online.
 */
export async function sampleGuild(client, row) {
  const { store } = client.beacon;
  const guild = client.guilds.cache.get(row.guild_id);
  if (!guild) return false;

  const today = dayOf();
  const counts = await fetchCounts(client, row.guild_id);
  const events = await fetchUpcomingEvents(guild, 14);
  store.addSample(row.guild_id, {
    day: today,
    members: counts.members,
    online: counts.online,
    eventsUpcoming: events.length,
  });

  const v = guildVisuals(guild);
  store.updateGuild(row.guild_id, {
    name: v.name,
    icon_url: v.iconUrl,
    banner_url: v.bannerUrl,
    nsfw: v.nsfw ? 1 : 0,
    ...(v.nsfw ? { published: 0 } : {}),
  });

  if (row.invite_code) {
    const uses = await fetchInviteUses(guild, row.invite_code);
    if (uses !== null) store.recordInviteUses(row.guild_id, uses, today);
  }

  lastSampled.set(row.guild_id, Date.now());
  return true;
}

/** Hourly: sample guilds that are due, then housekeeping. */
export async function runSampleJob(client) {
  const { store, directory, config } = client.beacon;
  const now = Date.now();
  let sampled = 0;

  for (const row of store.listAll()) {
    if (!client.guilds.cache.has(row.guild_id)) continue;
    const last = lastSampled.get(row.guild_id) ?? 0;
    const hasToday = store.latestSample(row.guild_id)?.day === dayOf();
    if (hasToday && now - last < RESAMPLE_MS) continue;
    try {
      if (await sampleGuild(client, row)) sampled++;
      await sleep(250); // be gentle with the REST API across hundreds of guilds
    } catch (err) {
      console.warn(`[SAMPLE] ${row.name} (${row.guild_id}): ${err.message}`);
    }
  }

  // Retention: purge servers removed 30+ days ago (and their banners), trim history to 90 days.
  for (const row of store.purgeDeleted(30)) {
    if (row.banner_path) await unlink(join(config.dataDir, "uploads", row.banner_path)).catch(() => {});
    console.log(`[SAMPLE] Purged data for ${row.name} (${row.guild_id})`);
  }
  store.prune(90);

  if (sampled) {
    directory.invalidate();
    console.log(`[SAMPLE] Sampled ${sampled} guild(s)`);
  }
}

/**
 * Page-view hook: refresh a guild's counts in the background when its data is
 * older than ten minutes, so a page that's getting traffic stays current.
 */
export function maybeRefresh(client, guildId) {
  const last = lastSampled.get(guildId) ?? 0;
  if (Date.now() - last < LAZY_MS) return;
  lastSampled.set(guildId, Date.now()); // claim the slot before the async work
  const row = client.beacon.store.getGuild(guildId);
  if (!row) return;
  sampleGuild(client, row)
    .then((ok) => ok && client.beacon.directory.invalidate())
    .catch((err) => console.warn(`[SAMPLE] lazy refresh ${guildId}: ${err.message}`));
}
