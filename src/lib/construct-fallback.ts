/**
 * Deterministic, no-LLM fallback for the Construct AI flow.
 *
 * Used when GROQ_API_KEY isn't configured, or when Groq is unreachable, so the
 * describe → clarify → generate → edit → deploy experience stays fully usable
 * (and demoable) offline. It keyword-detects server types from the user's prose
 * and reuses the wizard's `generateBlueprint` heuristics, so the output is a
 * real, valid Blueprint on the same code path. The UI labels this as offline.
 */

import {
  generateBlueprint,
  initialState,
  type Blueprint,
  type WizardState,
} from "./blueprint";
import type { AiAnswer, ClarifyResult } from "./construct-ai";

const TYPE_KEYWORDS: Record<string, string[]> = {
  gaming: ["gam", "esport", "fps", "mmo", "lfg", "squad", "valorant", "minecraft", "league"],
  school: ["school", "study", "class", "student", "homework", "exam", "university", "college", "course"],
  community: ["community", "social", "friends", "hangout", "fan", "club", "general"],
  crypto: ["crypto", "trading", "trade", "stock", "defi", "nft", "token", "market", "finance", "invest"],
  music: ["music", "song", "band", "dj", "producer", "listening", "artist"],
  tech: ["tech", "dev", "code", "coding", "programming", "startup", "saas", "engineer", "software"],
  creative: ["art", "creative", "design", "draw", "writer", "writing", "photo", "video", "creator"],
};

const MOD_KEYWORDS: Record<string, string[]> = {
  strict: ["strict", "moderat", "safe", "verif", "kids", "professional", "brand"],
  casual: ["casual", "chill", "relaxed", "open", "small", "laid-back", "laid back"],
};

function detectTypes(text: string): string[] {
  const lc = text.toLowerCase();
  const hits = Object.entries(TYPE_KEYWORDS)
    .filter(([, words]) => words.some((w) => lc.includes(w)))
    .map(([id]) => id);
  return hits.length ? hits.slice(0, 3) : ["community"];
}

function detectModeration(text: string): WizardState["moderation"] {
  const lc = text.toLowerCase();
  if (MOD_KEYWORDS.strict.some((w) => lc.includes(w))) return "strict";
  if (MOD_KEYWORDS.casual.some((w) => lc.includes(w))) return "casual";
  return "balanced";
}

function detectName(text: string): string {
  const quoted = text.match(/["“”']([^"“”']{2,40})["“”']/);
  if (quoted) return quoted[1].trim();
  const called = text.match(/\b(?:called|named)\s+([A-Z][\w' ]{1,30})/);
  if (called) return called[1].trim();
  return "";
}

function wantsVoice(text: string): boolean {
  const lc = text.toLowerCase();
  return /voice|vc|stage|talk|call|stream|podcast|listening/.test(lc);
}

/** Build a Blueprint from free text + answers without calling any model. */
export function fallbackBlueprint(description: string, answers: AiAnswer[]): Blueprint {
  const corpus = [description, ...answers.map((a) => a.answer)].join(" ");
  const types = detectTypes(corpus);
  const moderation = detectModeration(corpus);

  const features = [...initialState.features];
  if (wantsVoice(corpus) && !features.includes("voice")) features.push("voice");
  if (/event|stage|meetup|tournament/i.test(corpus)) features.push("events");
  if (/ticket|support|help desk|help-desk/i.test(corpus)) features.push("tickets");
  if (/level|xp|rank/i.test(corpus)) features.push("leveling");

  const channels = [...initialState.channels];
  if (/staff|team|mod team/i.test(corpus) && !channels.includes("STAFF")) channels.push("STAFF");
  if (/fun|meme|game night/i.test(corpus) && !channels.includes("FUN")) channels.push("FUN");

  const state: WizardState = {
    ...initialState,
    serverName: detectName(description),
    types,
    moderation,
    features: Array.from(new Set(features)),
    channels: Array.from(new Set(channels)),
    rolePacks: types.includes("gaming")
      ? ["basic", "gaming"]
      : types.includes("school")
        ? ["basic", "school"]
        : ["basic"],
  };

  return generateBlueprint(state);
}

/** A small, relevant set of clarifying questions, no model required. */
export function fallbackClarify(description: string, answers: AiAnswer[]): ClarifyResult {
  // One round only — then build.
  if (answers.length > 0) return { done: true };
  const types = detectTypes(description);
  const sizeQ = {
    id: "size",
    question: "How large do you expect it to get?",
    options: ["Under 100", "100–1,000", "1k–10k", "10k+"],
    allowFreeText: true,
  };
  const vibeQ = {
    id: "vibe",
    question: "What's the vibe?",
    options: ["Chill & casual", "Focused & organized", "High-energy", "Professional"],
    allowFreeText: true,
  };
  const modQ = {
    id: "moderation",
    question: "How strict should moderation be?",
    options: ["Light touch", "Balanced", "Strict / verified entry"],
    allowFreeText: false,
  };
  // Crypto/finance servers get a monetization/gating question instead of vibe.
  const gateQ = {
    id: "gating",
    question: "Any token / holder gating or paid tiers?",
    options: ["No gating", "Holder roles", "Paid tiers", "Not sure"],
    allowFreeText: true,
  };
  const questions = types.includes("crypto")
    ? [sizeQ, gateQ, modQ]
    : [sizeQ, vibeQ, modQ];
  return { done: false, questions };
}
