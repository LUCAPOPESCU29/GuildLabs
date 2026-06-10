import type { NextRequest } from "next/server";

/**
 * The origin the user actually hit — derived from the forwarded host so the
 * OAuth flow stays on the user's domain (e.g. www.guildlabs.fun) instead of
 * bouncing to the bare Vercel deployment URL. Falls back to NEXTAUTH_URL, then
 * the canonical production domain. Never returns a *.vercel.app URL on its own.
 */
export function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return process.env.NEXTAUTH_URL || "https://www.guildlabs.fun";
}
