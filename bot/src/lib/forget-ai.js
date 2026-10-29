/**
 * Groq-backed copywriter for Forget's embeds.
 *
 * The model writes the *words*; `forget-embeds.js` owns the visual design. That
 * split means a bad/slow model response degrades to a still-beautiful embed with
 * fallback copy rather than breaking the command.
 *
 * MODEL note: Groq retires models periodically (llama-3.3-70b-versatile was
 * decommissioned). This is a reasoning model, so reasoning_effort is pinned low
 * — otherwise reasoning burns most of the output budget and truncates the JSON.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const MODEL = "openai/gpt-oss-120b";
const TIMEOUT_MS = 15_000;

export function isAiConfigured() {
  return !!process.env.GROQ_API_KEY;
}

async function callGroq(messages, { json = true, maxTokens = 1200 } = {}) {
  if (!isAiConfigured()) throw new Error("GROQ_API_KEY is not set");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.8,
        max_tokens: maxTokens,
        reasoning_effort: "low",
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Groq ${res.status}: ${body.slice(0, 160)}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/** Pull the outermost JSON object out of a model response, tolerating fences. */
function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in response");
  return JSON.parse(text.slice(start, end + 1));
}

const SYSTEM = `You are Forget's in-house Discord copywriter.
Forget is a friendly, sharp productivity app. Write embed copy that is warm, concise and confident — never corporate filler, never emoji-spam.

HARD RULES — these matter more than style:
- NEVER invent facts, statistics, counts, dates, prices or names. If you weren't told a number, don't use one.
- NEVER reference channels (#name), roles (@name) or people unless they appear verbatim in the context.
- Write copy that stays true no matter the server's actual state. Prefer "check the queue" over "there are 42 tickets".
- If the context is thin, write something short and general rather than padding it with invented detail.

Return ONLY a JSON object with EXACTLY this shape:
{
  "title": string,        // <= 60 chars, no leading emoji
  "description": string,  // 1-3 short sentences, <= 320 chars, Discord markdown ok (**bold**, *italic*)
  "fields": [             // 0-4 fields, omit if they'd be filler
    { "name": string,     // <= 40 chars
      "value": string,    // <= 180 chars
      "inline": boolean }
  ],
  "footer": string        // <= 60 chars, a short sign-off
}`;

/**
 * Neutralise channel/role references the model invented.
 *
 * A `#channel` that doesn't exist renders as flat grey text in Discord, which
 * looks broken. Prompting alone doesn't reliably stop it, so we enforce it:
 * anything not in `allowed` loses its sigil and reads as an ordinary word.
 */
function stripUnknownRefs(text, allowed) {
  if (!text) return text;
  return text.replace(/([#@])([a-z0-9_-]{2,32})/gi, (match, sigil, name) =>
    allowed.has(name.toLowerCase()) ? match : name
  );
}

/**
 * Ask the model for embed copy. `kind` steers tone/purpose,
 * `context` is free text (server name, channel, what happened).
 * Always resolves — falls back to provided copy when the model is unavailable.
 */
export async function writeEmbedCopy(kind, context, fallback, allowedRefs = []) {
  const allowed = new Set(allowedRefs.map((r) => String(r).toLowerCase()));
  try {
    const raw = await callGroq([
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Embed type: ${kind}\nContext:\n${context}\n\nWrite the embed JSON now.`,
      },
    ]);
    const parsed = extractJson(raw);
    if (!parsed.title || !parsed.description) throw new Error("Missing title/description");

    return {
      title: stripUnknownRefs(String(parsed.title), allowed).slice(0, 60),
      description: stripUnknownRefs(String(parsed.description), allowed).slice(0, 900),
      fields: Array.isArray(parsed.fields)
        ? parsed.fields
            .filter((f) => f?.name && f?.value)
            .slice(0, 4)
            .map((f) => ({
              name: stripUnknownRefs(String(f.name), allowed).slice(0, 40),
              value: stripUnknownRefs(String(f.value), allowed).slice(0, 300),
              inline: !!f.inline,
            }))
        : [],
      footer: parsed.footer ? String(parsed.footer).slice(0, 60) : undefined,
      source: "ai",
    };
  } catch (err) {
    console.warn(`[forget-ai] falling back to static copy: ${err.message}`);
    return { ...fallback, source: "offline" };
  }
}
