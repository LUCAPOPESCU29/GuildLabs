/**
 * Rough US equity market-hours check (NYSE/Nasdaq regular session:
 * 09:30–16:00 America/New_York, Mon–Fri). Used to optionally suppress
 * watchlist auto-posts when the market is closed.
 *
 * This is intentionally a holiday-unaware approximation — it just avoids
 * spamming charts overnight/weekends. Crypto trades 24/7, so when a watchlist
 * contains only crypto symbols the caller can bypass this check.
 */

export function isUsMarketOpen(date = new Date()) {
  // Convert "now" into America/New_York wall-clock parts.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  const weekday = get("weekday");
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));

  if (weekday === "Sat" || weekday === "Sun") return false;

  const minutes = hour * 60 + minute;
  const open = 9 * 60 + 30; // 09:30
  const close = 16 * 60;    // 16:00
  return minutes >= open && minutes < close;
}

/** Is this symbol a 24/7 instrument (crypto / forex) that ignores market hours? */
export function isAlwaysOpen(symbol) {
  const s = String(symbol).toUpperCase();
  return s.endsWith("-USD") || s.endsWith("=X");
}
