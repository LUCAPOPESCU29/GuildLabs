import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { groqPoolStatus } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health of the Groq key pool. Reports counts only — never key material — so
 * it's safe to read when diagnosing "why is the builder offline?".
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pool = groqPoolStatus();
  return NextResponse.json(
    {
      ...pool,
      // Which env vars are actually populated at runtime, without leaking them.
      env: {
        GROQ_API_KEY: (process.env.GROQ_API_KEY ?? "").length,
        GROQ_API_KEYS: (process.env.GROQ_API_KEYS ?? "").length,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
