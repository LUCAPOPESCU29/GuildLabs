import { NextRequest, NextResponse } from "next/server";
import {
  buildGenerateSystem,
  sanitizeDescription,
  sanitizeAnswers,
  type ConstructError,
} from "@/lib/construct-ai";
import { callGroq, isGroqConfigured, GroqError } from "@/lib/groq";
import { rateLimit, clientIp, sweepExpired } from "@/lib/rate-limit";
import { validateBlueprint, BlueprintInvalid } from "@/lib/blueprint-validate";
import { fallbackBlueprint } from "@/lib/construct-fallback";
import type { Blueprint } from "@/lib/blueprint";

export const runtime = "nodejs";

export type GenerateOk = { ok: true; blueprint: Blueprint; source: "ai" | "offline" };

function fail(code: ConstructError["code"], error: string, status: number) {
  return NextResponse.json({ ok: false, code, error } satisfies ConstructError, {
    status,
  });
}

export async function POST(req: NextRequest) {
  sweepExpired();
  const limit = rateLimit(`generate:${clientIp(req)}`, 12, 60_000);
  if (!limit.ok) {
    return fail("rate_limited", "Too many requests — give it a moment.", 429);
  }

  const body = await req.json().catch(() => null);
  const description = sanitizeDescription(body?.description);
  if (!description) {
    return fail("bad_request", "Please describe your server in a bit more detail.", 400);
  }
  const answers = sanitizeAnswers(body?.answers);

  // No key configured → deterministic offline blueprint so the flow still works.
  if (!isGroqConfigured()) {
    return NextResponse.json({
      ok: true,
      blueprint: fallbackBlueprint(description, answers),
      source: "offline",
    } satisfies GenerateOk);
  }

  const userContent = [
    `Description:\n${description}`,
    answers.length
      ? `\nClarifying answers:\n${answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n")}`
      : "",
    "\nReturn the blueprint JSON now.",
  ].join("\n");

  let text: string;
  try {
    text = await callGroq(
      [
        { role: "system", content: buildGenerateSystem() },
        { role: "user", content: userContent },
      ],
      { json: true }
    );
  } catch (e) {
    if (e instanceof GroqError && e.kind === "timeout") {
      return fail("upstream_timeout", "The model took too long — try again.", 504);
    }
    return fail("upstream_error", "Couldn't reach the model — try again.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail("invalid_output", "Couldn't generate a valid blueprint — try rephrasing.", 422);
  }

  try {
    const blueprint = validateBlueprint(parsed);
    return NextResponse.json({ ok: true, blueprint, source: "ai" } satisfies GenerateOk);
  } catch (e) {
    if (e instanceof BlueprintInvalid) {
      return fail("invalid_output", "Couldn't generate a valid blueprint — try rephrasing.", 422);
    }
    return fail("upstream_error", "Something went wrong generating your server.", 500);
  }
}
