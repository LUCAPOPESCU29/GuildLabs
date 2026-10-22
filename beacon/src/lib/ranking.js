/**
 * Directory ranking. Pure and deterministic so it can be unit-tested and so
 * the README can state the formula honestly:
 *
 *   score = 0.45 · onlineRatio
 *         + 0.25 · growth7d (capped so big servers can't dominate)
 *         + 0.20 · min(events, 3) / 3
 *         + 0.10 · log1p(views7d) / log1p(1000)
 *
 * There is no bump command and no way to buy a position.
 */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Growth is measured in members; 50 new members in a week saturates the term. */
export const GROWTH_CAP = 50;
export const VIEWS_CAP = 1000;

export function scoreGuild({ members = 0, online = 0, growth7d = 0, eventsUpcoming = 0, views7d = 0 } = {}) {
  const onlineRatio = members > 0 ? clamp(online / members, 0, 1) : 0;
  const growth = clamp(growth7d / GROWTH_CAP, 0, 1);
  const events = clamp(Math.min(eventsUpcoming, 3) / 3, 0, 1);
  const views = clamp(Math.log1p(Math.max(0, views7d)) / Math.log1p(VIEWS_CAP), 0, 1);
  return 0.45 * onlineRatio + 0.25 * growth + 0.2 * events + 0.1 * views;
}

/**
 * Sort directory entries: featured first, then score, then size, then name.
 * Each entry must carry `{ featured, score, members, name }`.
 */
export function rankEntries(entries) {
  return [...entries].sort(
    (a, b) =>
      Number(!!b.featured) - Number(!!a.featured) ||
      b.score - a.score ||
      (b.members ?? 0) - (a.members ?? 0) ||
      String(a.name).localeCompare(String(b.name))
  );
}
