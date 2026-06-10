import cron from "node-cron";
import { runWatchlistTick } from "./watchlist-job.js";
import { runAlertTick } from "./alert-job.js";

/**
 * Starts the two background jobs. Both fire once a minute; each decides
 * internally whether there's anything to do, so we never hammer Yahoo.
 */
export function startScheduler(client) {
  // Watchlist auto-posts — gated by each guild's interval.
  cron.schedule("* * * * *", () => {
    runWatchlistTick(client).catch((e) => console.error("[SCHED] watchlist tick:", e.message));
  });

  // Price alerts — polled every minute, edge-triggered.
  cron.schedule("* * * * *", () => {
    runAlertTick(client).catch((e) => console.error("[SCHED] alert tick:", e.message));
  });

  console.log("[SCHED] Watchlist + alert jobs scheduled (every 1 min).");
}
