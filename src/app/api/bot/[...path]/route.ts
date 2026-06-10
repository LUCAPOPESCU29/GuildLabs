import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Use `||` (not `??`) so an empty-string env var falls back instead of
// producing a host-less URL that throws on fetch.
const BOT_API = (process.env.BOT_API_URL || "http://localhost:3008").replace(/\/+$/, "");
const BOT_KEY = process.env.BOT_API_KEY || "forge-local-dev";

// Never cache bot data (live guild list / config) at the browser or edge.
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

async function proxy(req: NextRequest, path: string[]) {
  // Require a signed-in session — the bot API (guild list, deploy, config) must
  // never be reachable anonymously.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: NO_STORE });
  }

  const url = `${BOT_API}/${path.join("/")}`;
  const isPost = req.method === "POST";

  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": BOT_KEY,
    },
    body: isPost ? await req.text() : undefined,
    cache: "no-store",
  }).catch(() => null);

  if (!res) {
    return NextResponse.json(
      { error: "Bot is offline. Make sure it's running locally." },
      { status: 503, headers: NO_STORE }
    );
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status, headers: NO_STORE });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}
