import { scoreGuild, rankEntries } from "./ranking.js";
import { isValidTag } from "./tags.js";

/**
 * The ranked directory, computed from the store and cached briefly. Building
 * it is a handful of small SQLite reads per published guild — cheap for
 * hundreds, still fine for thousands — and the 60 s cache keeps a busy
 * directory page from doing it on every request.
 */
export function createDirectory(store, { ttlMs = 60_000, now = () => Date.now() } = {}) {
  let cache = { at: 0, entries: null };

  function build() {
    const entries = store.listPublished().map((row) => {
      const latest = store.latestSample(row.guild_id);
      const members = latest?.members ?? 0;
      const online = latest?.online ?? 0;
      const eventsUpcoming = latest?.events_upcoming ?? 0;
      const growth7d = store.growth(row.guild_id, 7);
      const views7d = store.getHits(row.guild_id, 7).views;
      return {
        ...row,
        members,
        online,
        eventsUpcoming,
        growth7d,
        views7d,
        score: scoreGuild({ members, online, growth7d, eventsUpcoming, views7d }),
      };
    });
    return rankEntries(entries);
  }

  function entries() {
    const t = now();
    if (cache.entries && t - cache.at < ttlMs) return cache.entries;
    cache = { at: t, entries: build() };
    return cache.entries;
  }

  function filter({ q = "", tag = "" } = {}) {
    const needle = String(q ?? "").trim().toLowerCase();
    const t = String(tag ?? "").trim().toLowerCase();
    return entries().filter((e) => {
      if (t && !e.tags.includes(t)) return false;
      if (needle) {
        const hay = `${e.name} ${e.tagline ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }

  return {
    entries,
    invalidate() {
      cache = { at: 0, entries: null };
    },

    list({ q = "", tag = "", page = 1, perPage = 24 } = {}) {
      const all = filter({ q, tag });
      const pages = Math.max(1, Math.ceil(all.length / perPage));
      const p = Math.min(pages, Math.max(1, Number(page) || 1));
      return { items: all.slice((p - 1) * perPage, p * perPage), total: all.length, page: p, pages };
    },

    featured(limit = 6) {
      return entries().filter((e) => e.featured).slice(0, limit);
    },

    top(limit = 12) {
      return entries().slice(0, limit);
    },

    /** [{ tag, count }] sorted by count desc, only tags with at least one server. */
    tagCounts() {
      const counts = new Map();
      for (const e of entries()) for (const t of e.tags) if (isValidTag(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
      return [...counts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    },

    /** 1-based rank of a guild within a tag (or overall when tag is empty); null if unlisted. */
    rankOf(guildId, tag = "") {
      const list = filter({ tag });
      const i = list.findIndex((e) => e.guild_id === guildId);
      return i === -1 ? null : { rank: i + 1, of: list.length };
    },
  };
}
