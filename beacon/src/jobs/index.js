import { runSampleJob } from "./sample.js";
import { runInviteJob } from "./invites.js";
import { runDigestJob } from "./digest.js";

/**
 * One hourly tick drives every background job. Each job is idempotent for
 * its own period (per-day samples, once-a-day invite checks, once-a-week
 * digests), so a restart or a missed tick never double-posts or double-counts.
 */
export function startJobs(client) {
  let running = false;

  async function tick() {
    if (running) return;
    running = true;
    try {
      await runSampleJob(client);
      await runInviteJob(client);
      await runDigestJob(client);
    } catch (err) {
      console.error("[JOBS] tick failed:", err);
    } finally {
      running = false;
    }
  }

  const initial = setTimeout(tick, 15_000);
  const interval = setInterval(tick, 60 * 60_000);
  initial.unref?.();
  interval.unref?.();

  return {
    tick,
    stop() {
      clearTimeout(initial);
      clearInterval(interval);
    },
  };
}
