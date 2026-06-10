/**
 * Outbound links that depend on environment config. Centralized so a missing
 * env var degrades to a safe in-site fallback instead of a broken invite URL.
 */

/** "Add ChartIt to Discord" — set NEXT_PUBLIC_CHARTIT_INVITE_URL in prod. */
export const CHARTIT_INVITE = process.env.NEXT_PUBLIC_CHARTIT_INVITE_URL || "/bots/chartit";

/** Whether the invite points off-site (real OAuth) vs. the in-site product page. */
export const CHARTIT_INVITE_EXTERNAL = CHARTIT_INVITE.startsWith("http");
