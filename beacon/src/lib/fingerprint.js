import { createHash, randomBytes } from "node:crypto";

/**
 * View de-duplication without storing anything personal. Each visitor is
 * reduced to a short hash of (daily random salt + IP + user agent); the salt
 * lives only in memory and rotates every day, so hashes can't be joined across
 * days or reversed. Counts restart after a process restart, which is fine.
 */

export const BOT_UA =
  /bot|crawl|spider|slurp|fetch|curl|wget|python|monitor|preview|headless|lighthouse|pingdom|facebookexternalhit|discordbot|embedly|whatsapp|telegram|skype|slack/i;

export function isBotUserAgent(ua) {
  return !ua || BOT_UA.test(String(ua));
}

export function createViewDeduper({ windowMs = 3_600_000, now = () => Date.now() } = {}) {
  const salts = new Map(); // day → salt
  const seen = new Map(); // key → expiry
  let lastPrune = 0;

  function saltFor(day) {
    if (!salts.has(day)) {
      salts.set(day, randomBytes(16).toString("hex"));
      // Keep only today's and yesterday's salt.
      for (const k of salts.keys()) if (k !== day && salts.size > 2) salts.delete(k);
    }
    return salts.get(day);
  }

  function prune(t) {
    if (t - lastPrune < 60_000) return;
    lastPrune = t;
    for (const [k, exp] of seen) if (exp <= t) seen.delete(k);
  }

  return {
    /** True when this visit should be counted as a new view for the guild. */
    shouldCount(guildId, ip, ua) {
      if (isBotUserAgent(ua)) return false;
      const t = now();
      prune(t);
      const day = new Date(t).toISOString().slice(0, 10);
      const hash = createHash("sha256")
        .update(`${saltFor(day)}|${ip ?? ""}|${ua ?? ""}`)
        .digest("hex")
        .slice(0, 16);
      const key = `${guildId}:${hash}`;
      const exp = seen.get(key);
      if (exp && exp > t) return false;
      seen.set(key, t + windowMs);
      return true;
    },
    size() {
      return seen.size;
    },
  };
}
