/**
 * Tiny in-memory token bucket per client IP. Enough to stop a single scraper
 * from hammering the directory; a real DDoS is the reverse proxy's job.
 */
export function createRateLimiter({ capacity = 60, refillPerSec = 1, now = () => Date.now() } = {}) {
  const buckets = new Map();
  let lastSweep = 0;

  function sweep(t) {
    if (t - lastSweep < 60_000) return;
    lastSweep = t;
    for (const [ip, b] of buckets) if (t - b.at > 10 * 60_000) buckets.delete(ip);
  }

  return function rateLimit(req, res, next) {
    const t = now();
    sweep(t);
    const ip = req.ip ?? "unknown";
    const b = buckets.get(ip) ?? { tokens: capacity, at: t };
    b.tokens = Math.min(capacity, b.tokens + ((t - b.at) / 1000) * refillPerSec);
    b.at = t;
    if (b.tokens < 1) {
      buckets.set(ip, b);
      res.set("Retry-After", "5");
      return res.status(429).type("text/plain").send("Too many requests — slow down a little.");
    }
    b.tokens -= 1;
    buckets.set(ip, b);
    next();
  };
}
