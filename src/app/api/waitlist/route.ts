import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp, bodyTooLarge } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Optional Discord webhook to receive signups (durable, $0 — they land in your
// own server). When unset, the route still accepts the email so the UI works;
// set WAITLIST_WEBHOOK_URL in the environment to actually capture them.
const WEBHOOK = process.env.WAITLIST_WEBHOOK_URL;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/waitlist  — { email, product? }
 * Records interest for an upcoming product (e.g. Queen): an email + which
 * product, forwarded to a Discord webhook. Low trust, rate-limited.
 */
export async function POST(req: NextRequest) {
  const limit = rateLimit(`waitlist:${clientIp(req)}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "Too many requests — give it a moment." }, { status: 429 });
  }
  if (bodyTooLarge(req, 4_000)) {
    return NextResponse.json({ ok: false, error: "Request too large." }, { status: 413 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 254) : "";
  const product = typeof body?.product === "string" ? body.product.trim().slice(0, 40) : "Queen";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  }

  if (WEBHOOK) {
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "GuildLabs Waitlist",
          embeds: [{ title: `New ${product} waitlist signup`, description: `**${email}**`, color: 0x9b6dff }],
        }),
      });
    } catch {
      // Non-fatal: a dropped webhook shouldn't surface to the user as a failure.
    }
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
