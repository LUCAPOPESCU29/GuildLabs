/**
 * Data access for Beacon. Every query lives here so commands, jobs, and the
 * web layer never touch SQL directly — and so tests can run the whole web app
 * against an in-memory database with no Discord connection.
 */

export const nowIso = () => new Date().toISOString();
export const dayOf = (d = new Date()) => d.toISOString().slice(0, 10);

/** Day string for `daysAgo` days before `from`. */
export function dayShift(daysAgo, from = new Date()) {
  const d = new Date(from.getTime() - daysAgo * 86_400_000);
  return dayOf(d);
}

function parseRow(row) {
  if (!row) return null;
  let tags = [];
  try {
    tags = JSON.parse(row.tags || "[]");
  } catch {
    tags = [];
  }
  return {
    ...row,
    tags: Array.isArray(tags) ? tags : [],
    nsfw: !!row.nsfw,
    published: !!row.published,
    featured: !!row.featured,
    banned: !!row.banned,
    digestEnabled: !!row.digest_enabled,
  };
}

/** A page can only exist once the owner has finished `/beacon setup`. */
export function isSetupComplete(row) {
  return !!(row && row.slug && row.tagline && row.invite_code && row.tags.length > 0);
}

const GUILD_COLUMNS = new Set([
  "slug", "name", "icon_url", "banner_url", "banner_path", "tagline", "description",
  "tags", "invite_code", "invite_channel_id", "nsfw", "published", "featured", "banned",
  "ban_reason", "digest_channel_id", "digest_enabled", "last_digest_at", "deleted_at",
]);

export function createStore(db) {
  const q = {
    getGuild: db.prepare("SELECT * FROM guilds WHERE guild_id = ?"),
    getBySlug: db.prepare("SELECT * FROM guilds WHERE slug = ?"),
    slugTaken: db.prepare("SELECT guild_id FROM guilds WHERE slug = ? AND guild_id <> ?"),
    insertGuild: db.prepare(
      `INSERT INTO guilds (guild_id, name, icon_url, banner_url, nsfw, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ),
    listAll: db.prepare("SELECT * FROM guilds WHERE deleted_at IS NULL"),
    listPublished: db.prepare(
      "SELECT * FROM guilds WHERE published = 1 AND banned = 0 AND deleted_at IS NULL"
    ),
    listDeletedBefore: db.prepare("SELECT * FROM guilds WHERE deleted_at IS NOT NULL AND deleted_at < ?"),
    deleteGuild: db.prepare("DELETE FROM guilds WHERE guild_id = ?"),
    deleteSamples: db.prepare("DELETE FROM samples WHERE guild_id = ?"),
    deleteHits: db.prepare("DELETE FROM hits WHERE guild_id = ?"),
    deleteInviteUses: db.prepare("DELETE FROM invite_uses WHERE guild_id = ?"),

    // Re-sampling within a day keeps the latest member count but the *peak*
    // online count, so a server isn't penalised for being sampled at 4 am.
    upsertSample: db.prepare(
      `INSERT INTO samples (guild_id, day, members, online, events_upcoming) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(guild_id, day) DO UPDATE SET members = excluded.members,
       online = MAX(online, excluded.online), events_upcoming = excluded.events_upcoming`
    ),
    samplesSince: db.prepare(
      "SELECT day, members, online, events_upcoming FROM samples WHERE guild_id = ? AND day >= ? ORDER BY day ASC"
    ),
    latestSample: db.prepare(
      "SELECT day, members, online, events_upcoming FROM samples WHERE guild_id = ? ORDER BY day DESC LIMIT 1"
    ),
    sampleOnOrBefore: db.prepare(
      "SELECT day, members FROM samples WHERE guild_id = ? AND day <= ? ORDER BY day DESC LIMIT 1"
    ),

    bumpView: db.prepare(
      `INSERT INTO hits (guild_id, day, views, clicks) VALUES (?, ?, 1, 0)
       ON CONFLICT(guild_id, day) DO UPDATE SET views = views + 1`
    ),
    bumpClick: db.prepare(
      `INSERT INTO hits (guild_id, day, views, clicks) VALUES (?, ?, 0, 1)
       ON CONFLICT(guild_id, day) DO UPDATE SET clicks = clicks + 1`
    ),
    hitsSince: db.prepare(
      "SELECT COALESCE(SUM(views), 0) AS views, COALESCE(SUM(clicks), 0) AS clicks FROM hits WHERE guild_id = ? AND day >= ?"
    ),

    upsertInviteUses: db.prepare(
      `INSERT INTO invite_uses (guild_id, day, uses) VALUES (?, ?, ?)
       ON CONFLICT(guild_id, day) DO UPDATE SET uses = excluded.uses`
    ),
    inviteUsesOnOrBefore: db.prepare(
      "SELECT uses FROM invite_uses WHERE guild_id = ? AND day <= ? ORDER BY day DESC LIMIT 1"
    ),
    latestInviteUses: db.prepare(
      "SELECT uses FROM invite_uses WHERE guild_id = ? ORDER BY day DESC LIMIT 1"
    ),

    pruneSamples: db.prepare("DELETE FROM samples WHERE day < ?"),
    pruneHits: db.prepare("DELETE FROM hits WHERE day < ?"),
    pruneInviteUses: db.prepare("DELETE FROM invite_uses WHERE day < ?"),

    getMeta: db.prepare("SELECT value FROM meta WHERE key = ?"),
    setMeta: db.prepare(
      "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ),
    countPublished: db.prepare(
      "SELECT COUNT(*) AS n FROM guilds WHERE published = 1 AND banned = 0 AND deleted_at IS NULL"
    ),
  };

  const store = {
    // ── Guild rows ───────────────────────────────────────────────────────────
    getGuild(guildId) {
      return parseRow(q.getGuild.get(guildId));
    },

    getBySlug(slug) {
      return parseRow(q.getBySlug.get(slug));
    },

    /** Ensure a row exists for a guild the bot is in; refresh its Discord-side fields. */
    upsertDraft({ guildId, name, iconUrl = null, bannerUrl = null, nsfw = false }) {
      const existing = q.getGuild.get(guildId);
      const ts = nowIso();
      if (!existing) {
        q.insertGuild.run(guildId, name, iconUrl, bannerUrl, nsfw ? 1 : 0, ts, ts);
        return { row: store.getGuild(guildId), created: true };
      }
      store.updateGuild(guildId, {
        name,
        icon_url: iconUrl,
        banner_url: bannerUrl,
        nsfw: nsfw ? 1 : 0,
        deleted_at: null,
      });
      return { row: store.getGuild(guildId), created: false };
    },

    updateGuild(guildId, patch) {
      const keys = Object.keys(patch).filter((k) => GUILD_COLUMNS.has(k));
      if (!keys.length) return store.getGuild(guildId);
      const sets = keys.map((k) => `${k} = ?`).join(", ");
      const values = keys.map((k) => {
        const v = patch[k];
        if (k === "tags") return JSON.stringify(v ?? []);
        if (typeof v === "boolean") return v ? 1 : 0;
        return v ?? null;
      });
      db.prepare(`UPDATE guilds SET ${sets}, updated_at = ? WHERE guild_id = ?`).run(
        ...values,
        nowIso(),
        guildId
      );
      return store.getGuild(guildId);
    },

    isSlugTaken(slug, exceptGuildId = "") {
      return !!q.slugTaken.get(slug, exceptGuildId);
    },

    softDelete(guildId) {
      return store.updateGuild(guildId, { published: 0, deleted_at: nowIso() });
    },

    /** Hard-delete rows that were soft-deleted more than `days` ago. Returns the purged rows. */
    purgeDeleted(days = 30) {
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
      const rows = q.listDeletedBefore.all(cutoff).map(parseRow);
      for (const row of rows) store.hardDelete(row.guild_id);
      return rows;
    },

    hardDelete(guildId) {
      q.deleteSamples.run(guildId);
      q.deleteHits.run(guildId);
      q.deleteInviteUses.run(guildId);
      q.deleteGuild.run(guildId);
    },

    listAll() {
      return q.listAll.all().map(parseRow);
    },

    /** Rows eligible for the directory: published, not banned, not deleted, setup complete. */
    listPublished() {
      return q.listPublished.all().map(parseRow).filter(isSetupComplete);
    },

    countPublished() {
      return q.countPublished.get().n;
    },

    // ── Samples ──────────────────────────────────────────────────────────────
    addSample(guildId, { day = dayOf(), members = 0, online = 0, eventsUpcoming = 0 }) {
      q.upsertSample.run(guildId, day, members, online, eventsUpcoming);
    },

    getSamples(guildId, days = 90) {
      return q.samplesSince.all(guildId, dayShift(days));
    },

    latestSample(guildId) {
      return q.latestSample.get(guildId) ?? null;
    },

    /** Member delta over the last `days` days; 0 when there isn't enough history. */
    growth(guildId, days = 7) {
      const latest = q.latestSample.get(guildId);
      if (!latest) return 0;
      const past = q.sampleOnOrBefore.get(guildId, dayShift(days));
      if (!past) return 0;
      return latest.members - past.members;
    },

    // ── Hits ─────────────────────────────────────────────────────────────────
    recordView(guildId, day = dayOf()) {
      q.bumpView.run(guildId, day);
    },

    recordClick(guildId, day = dayOf()) {
      q.bumpClick.run(guildId, day);
    },

    getHits(guildId, days = 7) {
      const r = q.hitsSince.get(guildId, dayShift(days - 1));
      return { views: Number(r?.views ?? 0), clicks: Number(r?.clicks ?? 0) };
    },

    // ── Invite uses (only when the bot has Manage Server) ────────────────────
    recordInviteUses(guildId, uses, day = dayOf()) {
      q.upsertInviteUses.run(guildId, day, uses);
    },

    /** Invite uses gained over the last `days` days, or null when never measured. */
    inviteUsesDelta(guildId, days = 7) {
      const latest = q.latestInviteUses.get(guildId);
      if (!latest) return null;
      const past = q.inviteUsesOnOrBefore.get(guildId, dayShift(days));
      if (!past) return latest.uses;
      return Math.max(0, latest.uses - past.uses);
    },

    // ── Housekeeping ─────────────────────────────────────────────────────────
    prune(days = 90) {
      const cutoff = dayShift(days);
      q.pruneSamples.run(cutoff);
      q.pruneHits.run(cutoff);
      q.pruneInviteUses.run(cutoff);
    },

    getMeta(key) {
      return q.getMeta.get(key)?.value ?? null;
    },

    setMeta(key, value) {
      q.setMeta.run(key, String(value));
    },

    close() {
      db.close();
    },
  };

  return store;
}
