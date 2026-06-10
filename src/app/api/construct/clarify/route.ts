import { NextRequest, NextResponse } from "next/server";
import {
  CLARIFY_SYSTEM,
  CAPS,
  sanitizeDescription,
  sanitizeAnswers,
  type ClarifyResult,
  type ClarifyQuestion,
} from "@/lib/construct-ai";
import { callGroq, isGroqConfigured } from "@/lib/groq";
import { rateLimit, clientIp, sweepExpired } from "@/lib/rate-limit";
import { fallbackClarify } from "@/lib/construct-fallback";

export const runtime = "nodejs";

/** Coerce arbitrary model JSON into a safe ClarifyResult. */
function parseClarify(text: string): ClarifyResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { done: true };
  }
  if (!data || typeof data !== "object") return { done: true };
  const obj = data as Record<string, unknown>;
  if (obj.done === true) return { done: true };

  const rawQs = Array.isArray(obj.questions) ? obj.questions : [];
  const questions: ClarifyQuestion[] = rawQs
    .filter((q): q is Record<string, unknown> => !!q && typeof q === "object")
    .map((q, i) => {
      const question = String(q.question ?? "").trim().slice(0, 140);
      const options = Array.isArray(q.options)
        ? q.options.map((o) => String(o).trim().slice(0, 48)).filter(Boolean).slice(0, 6)
        : undefined;
      return {
        id: String(q.id ?? `q${i}`).slice(0, 32),
        question,
        ...(options && options.length ? { options } : {}),
        allowFreeText: q.allowFreeText !== false,
      };
    })
    .filter((q) => q.question.length > 0)
    .slice(0, CAPS.questionsPerRound);

  if (questions.length === 0) return { done: true };
  return { done: false, questions };
}

export async function POST(req: NextRequest) {
  sweepExpired();
  const limit = rateLimit(`clarify:${clientIp(req)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { done: true } satisfies ClarifyResult,
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const description = sanitizeDescription(body?.description);
  if (!description) {
    return NextResponse.json(
      { error: "Please describe your server in a bit more detail." },
      { status: 400 }
    );
  }
  const answers = sanitizeAnswers(body?.answers);

  // Hard stop so the clarify loop can never run forever.
  if (answers.length >= CAPS.answers) {
    return NextResponse.json({ done: true } satisfies ClarifyResult);
  }

  if (!isGroqConfigured()) {
    return NextResponse.json(fallbackClarify(description, answers));
  }

  const userContent = [
    `Server description:\n${description}`,
    answers.length
      ? `\nAnswers so far:\n${answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n")}`
      : "",
    `\nThis is round ${Math.floor(answers.length / CAPS.questionsPerRound) + 1} of at most ${CAPS.clarifyRounds}. If you have enough, return {"done": true}.`,
  ].join("\n");

  try {
    const text = await callGroq(
      [
        { role: "system", content: CLARIFY_SYSTEM },
        { role: "user", content: userContent },
      ],
      { json: true }
    );
    return NextResponse.json(parseClarify(text));
  } catch {
    // Clarify is best-effort: if the model is unavailable, proceed to generate.
    return NextResponse.json({ done: true } satisfies ClarifyResult);
  }
}
