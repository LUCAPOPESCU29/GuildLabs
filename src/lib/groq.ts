/**
 * Server-only Groq client. The API key never leaves the server — every call to
 * the model goes through the Next.js route handlers that import this module.
 *
 * Groq is OpenAI-compatible, so this is a thin fetch wrapper with a timeout and
 * a single retry. It throws typed `GroqError`s the route handlers turn into the
 * `ConstructError` shape the UI knows how to render.
 */

import "server-only";
import { MODEL } from "./construct-ai";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 20_000;

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export type GroqErrorKind = "not_configured" | "timeout" | "upstream";

export class GroqError extends Error {
  kind: GroqErrorKind;
  status?: number;
  constructor(kind: GroqErrorKind, message: string, status?: number) {
    super(message);
    this.name = "GroqError";
    this.kind = kind;
    this.status = status;
  }
}

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

async function once(
  messages: GroqMessage[],
  json: boolean,
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2400,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GroqError(
      "upstream",
      `Groq responded ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
      res.status
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new GroqError("upstream", "Groq returned an empty response.");
  return content;
}

/**
 * Call Groq with one retry on timeout / transient (5xx) errors. `json: true`
 * requests a strict JSON object response.
 */
export async function callGroq(
  messages: GroqMessage[],
  opts: { json?: boolean } = {}
): Promise<string> {
  if (!isGroqConfigured()) {
    throw new GroqError("not_configured", "GROQ_API_KEY is not set.");
  }

  const attempt = async (): Promise<string> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      return await once(messages, !!opts.json, ctrl.signal);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        throw new GroqError("timeout", "The model took too long to respond.");
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await attempt();
  } catch (e) {
    const retryable =
      e instanceof GroqError &&
      (e.kind === "timeout" || (e.kind === "upstream" && (e.status ?? 500) >= 500));
    if (!retryable) throw e;
    return await attempt();
  }
}
