/**
 * Slugs are the public identity of a server page (`/s/<slug>`), so they're
 * strict: lowercase, 3–32 chars of [a-z0-9-], never a route name.
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 32;
export const SLUG_RE = /^(?!.*--)[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/;

/** Words that would collide with routes or confuse people. */
export const RESERVED = new Set([
  "servers", "server", "s", "api", "admin", "static", "public", "uploads", "health",
  "sitemap", "sitemap.xml", "robots", "robots.txt", "join", "tags", "tag", "search",
  "login", "logout", "about", "terms", "privacy", "report", "beacon", "discord", "www",
  "new", "edit", "delete", "null", "undefined",
]);

/** Best-effort slug from a free-form name. May be too short — see `slugFromName`. */
export function slugify(input) {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

/** Validate a user-supplied slug. Returns `{ ok: true }` or `{ ok: false, error }`. */
export function validateSlug(slug) {
  const s = String(slug ?? "");
  if (s.length < SLUG_MIN || s.length > SLUG_MAX) {
    return { ok: false, error: `Slugs are ${SLUG_MIN}–${SLUG_MAX} characters long.` };
  }
  if (!SLUG_RE.test(s)) {
    return {
      ok: false,
      error: "Use lowercase letters, numbers, and single hyphens — no spaces, and it can't start or end with a hyphen.",
    };
  }
  if (RESERVED.has(s)) {
    return { ok: false, error: `“${s}” is reserved. Pick something else.` };
  }
  return { ok: true };
}

/**
 * Derive a valid, unique default slug from a guild name.
 * `isTaken(slug)` lets the caller consult the database.
 */
export function slugFromName(name, guildId, isTaken = () => false) {
  let base = slugify(name);
  if (base.length < SLUG_MIN || RESERVED.has(base)) {
    base = `server-${String(guildId).slice(-6)}`;
  }
  if (!isTaken(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`;
    const candidate = base.slice(0, SLUG_MAX - suffix.length) + suffix;
    if (!isTaken(candidate)) return candidate;
  }
  return `server-${String(guildId).slice(-8)}`;
}
