/**
 * Shared contracts for the AI server-builder flow (describe → clarify → generate).
 *
 * This module is framework-agnostic and safe to import on both the server (route
 * handlers) and the client (the AI builder UI), so the request/response shapes
 * stay in one place and never drift. The Groq calls themselves live in
 * `groq.ts` (server-only); the Yup validation lives in `blueprint-validate.ts`.
 */

import { PERM_PRESETS, ROLE_PALETTE, type PermPreset, type Blueprint } from "./blueprint";

// ── Input caps (token / cost guard) ──────────────────────────────────────────
export const CAPS = {
  description: { min: 12, max: 2000 },
  answers: 16,
  answerLen: 600,
  questionsPerRound: 3,
  clarifyRounds: 4,
  categories: 16,
  channelsPerCategory: 40,
  roles: 30,
} as const;

export const CHANNEL_TYPES = ["text", "voice", "stage", "forum"] as const;
export const PERM_KEYS = Object.keys(PERM_PRESETS) as PermPreset[];

export const MODEL = "llama-3.3-70b-versatile";

// ── Wire types ────────────────────────────────────────────────────────────────

/** One answered clarifying question, threaded back into the next request. */
export type AiAnswer = { question: string; answer: string };

export type ClarifyQuestion = {
  id: string;
  /** The question text, e.g. "How large do you expect the community to get?" */
  question: string;
  /** Optional quick-answer choices; the UI renders these as chips. */
  options?: string[];
  /** Whether a free-text answer is also allowed (default true). */
  allowFreeText?: boolean;
};

export type ClarifyResult =
  | { done: false; questions: ClarifyQuestion[] }
  | { done: true };

/** What the model is asked to emit for a blueprint (perms as preset *keys*). */
export type RawBlueprint = {
  name: string;
  summary: string;
  mixNote?: string;
  categories: Array<{
    name: string;
    emoji?: string;
    channels: Array<{ name: string; type?: string }>;
  }>;
  roles: Array<{
    name: string;
    color?: string;
    hoist?: boolean;
    perms?: string;
  }>;
  permissions?: string[];
};

export type ConstructErrorCode =
  | "bad_request"
  | "rate_limited"
  | "upstream_timeout"
  | "upstream_error"
  | "invalid_output"
  | "not_configured";

export type ConstructError = { ok: false; code: ConstructErrorCode; error: string };

// ── Input validation / sanitisation (shared) ─────────────────────────────────

/** Trim + clamp the free-text description; returns null when unusable. */
export function sanitizeDescription(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, CAPS.description.max);
  if (trimmed.length < CAPS.description.min) return null;
  return trimmed;
}

/** Coerce the answer log into a safe, capped array. */
export function sanitizeAnswers(input: unknown): AiAnswer[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (a): a is { question: unknown; answer: unknown } =>
        !!a && typeof a === "object"
    )
    .map((a) => ({
      question: String((a as AiAnswer).question ?? "").slice(0, CAPS.answerLen),
      answer: String((a as AiAnswer).answer ?? "").slice(0, CAPS.answerLen),
    }))
    .filter((a) => a.question && a.answer)
    .slice(0, CAPS.answers);
}

// ── System prompts ────────────────────────────────────────────────────────────

export const CLARIFY_SYSTEM = `You are Construct, an expert Discord server architect helping a user design their server.

The user has written a short description of the server they want. Your job is to decide whether you have enough to design a great, realistic Discord server — and if not, ask up to ${CAPS.questionsPerRound} short, concrete clarifying questions.

Ask only about things that materially change the layout: audience & size, languages, moderation strictness, voice/stage needs, monetization or holder gating, key topics/channels, and overall vibe. Never ask more than ${CAPS.questionsPerRound} questions at once. Prefer multiple-choice questions with 3–5 tappable options; keep each question under 90 characters. Do not repeat anything the user already told you.

When you already have enough to build a thoughtful server, you MUST stop asking and signal completion.

Respond with ONLY a JSON object, no prose, in exactly one of these two shapes:
{"done": true}
or
{"done": false, "questions": [{"id": "size", "question": "How big do you expect it to get?", "options": ["< 100", "100–1k", "1k–10k", "10k+"], "allowFreeText": true}]}`;

// ── Honour explicit count requests ("at least 20 channels and 13 roles") ─────
function numBefore(text: string, keyword: string): number | null {
  const idx = text.indexOf(keyword);
  if (idx < 0) return null;
  const nums = text.slice(Math.max(0, idx - 28), idx).match(/\d+/g);
  return nums ? parseInt(nums[nums.length - 1], 10) : null;
}

const CHANNEL_PAD_POOL = [
  "lounge", "media", "polls", "clips", "events", "resources", "feedback",
  "introductions", "off-topic", "memes", "wins", "watchlist", "ideas", "news",
  "alerts", "questions", "showcase", "support", "general-chat", "daily-discussion",
];
const ROLE_PAD_POOL = [
  "Member", "Regular", "Active", "Contributor", "Supporter", "Veteran", "VIP",
  "Elite", "Rookie", "Mentor", "Analyst", "Trader", "Investor", "Helper",
];

/**
 * If the user explicitly asked for a minimum number of channels/roles, pad the
 * blueprint with sensible extras so we don't undershoot the request. Recomputes
 * stats. Pure + client-safe.
 */
export function enforceCounts(bp: Blueprint, description: string): Blueprint {
  const lc = description.toLowerCase();
  const reqChannels = numBefore(lc, "chan");
  const reqRoles = numBefore(lc, "role");

  const categories = bp.categories.map((c) => ({ ...c, channels: [...c.channels] }));
  const roles = [...bp.roles];

  if (reqChannels && reqChannels > 0) {
    const cap = Math.min(reqChannels, CAPS.categories * CAPS.channelsPerCategory, 60);
    const seen = new Set(categories.flatMap((c) => c.channels.map((ch) => ch.name.toLowerCase())));
    const target =
      categories.find((c) => !["STAFF", "INFO"].includes(c.name.toUpperCase())) ??
      categories[categories.length - 1];
    let total = categories.reduce((n, c) => n + c.channels.length, 0);
    let i = 0;
    while (total < cap && i < CHANNEL_PAD_POOL.length * 4 && target) {
      const base = CHANNEL_PAD_POOL[i % CHANNEL_PAD_POOL.length];
      const suffix = i >= CHANNEL_PAD_POOL.length ? `-${Math.floor(i / CHANNEL_PAD_POOL.length) + 1}` : "";
      const name = `${base}${suffix}`;
      i++;
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      target.channels.push({ name, type: "text" });
      total++;
    }
  }

  if (reqRoles && reqRoles > 0) {
    const cap = Math.min(reqRoles, CAPS.roles);
    const seen = new Set(roles.map((r) => r.name.toLowerCase()));
    let i = 0;
    while (roles.length < cap && i < ROLE_PAD_POOL.length * 4) {
      const base = ROLE_PAD_POOL[i % ROLE_PAD_POOL.length];
      const suffix = i >= ROLE_PAD_POOL.length ? ` ${Math.floor(i / ROLE_PAD_POOL.length) + 1}` : "";
      const name = `${base}${suffix}`;
      i++;
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      roles.push({ name, color: ROLE_PALETTE[roles.length % ROLE_PALETTE.length], hoist: false, perms: PERM_PRESETS.member });
    }
  }

  const allChannels = categories.flatMap((c) => c.channels);
  return {
    ...bp,
    categories,
    roles,
    stats: {
      categories: categories.length,
      channels: allChannels.length,
      voice: allChannels.filter((c) => c.type === "voice" || c.type === "stage").length,
      roles: roles.length,
    },
  };
}

export function buildGenerateSystem(): string {
  const palette = ROLE_PALETTE.join(", ");
  const permList = PERM_KEYS.map((k) => `"${k}" (${PERM_PRESETS[k]})`).join(", ");
  return `You are Construct, an expert Discord server architect. Turn the user's description and answers into a single, realistic, deployable Discord server blueprint.

Output ONLY a JSON object (no markdown, no prose) matching EXACTLY this schema:
{
  "name": string,                       // the server name, <= 60 chars
  "summary": string,                    // one sentence describing the server
  "mixNote": string,                    // one sentence on the layout decisions you made
  "categories": [                       // 3-${CAPS.categories} categories, ordered top to bottom
    {
      "name": string,                   // UPPERCASE short label, e.g. "INFO", <= 24 chars
      "emoji": string,                  // a single emoji for the category
      "channels": [                     // 1-${CAPS.channelsPerCategory} channels
        { "name": string,               // lowercase-kebab for text, Title Case for voice, <= 24 chars
          "type": one of ${JSON.stringify(CHANNEL_TYPES)} }
      ]
    }
  ],
  "roles": [                            // 2-${CAPS.roles} roles, highest authority first
    {
      "name": string,                   // <= 24 chars
      "color": string,                  // hex like "#5865f2"; prefer these: ${palette}
      "hoist": boolean,                 // show separately in the member list
      "perms": one of ${permList}       // use the KEY only, e.g. "mod"
    }
  ],
  "permissions": [string]               // 3-8 plain-English notes about access & moderation
}

Rules:
- Design for the SPECIFIC community described. Reflect their audience, size, languages, vibe and topics in the channel and role names.
- Always include an info/rules area and at least one general chat. Add voice only if it fits.
- Use realistic Discord naming. No duplicate channel names within a category. No duplicate role names.
- Exactly one administrator-level role. Keep the hierarchy sensible (staff above members).
- If the community is finance/crypto/trading related, include a disclaimers channel and a "not financial advice" note in permissions.
- Keep it tasteful and deployable — quality over quantity.`;
}
