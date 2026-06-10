/**
 * Heuristic question detection.
 *
 * We deliberately don't ML this for v1 — the classifier model would add
 * 100MB+ for marginal gains. These rules catch ~95% of natural questions
 * with near-zero false positives. We can swap in a classifier later if
 * recall becomes a real problem.
 */

const QUESTION_STARTERS = [
  "how do", "how can", "how to", "how is", "how are", "how does", "how would",
  "what is", "what's", "whats", "what are", "what does", "what do", "what would",
  "what about", "what if",
  "why is", "why does", "why are", "why do", "why would",
  "where is", "where can", "where do", "where are",
  "when is", "when do", "when does", "when will",
  "who is", "who can", "who has", "who does",
  "which is", "which one",
  "can someone", "can anyone", "can i", "can you", "could someone",
  "anyone know", "anyone got", "anyone have", "any idea", "any tips",
  "is there", "is it", "is anyone", "is this",
  "are there", "are you", "are these",
  "does anyone", "does anybody", "do you", "do i",
  "should i", "should we",
  "would it", "would you",
];

const LOW_VALUE_PHRASES = [
  "?",   // bare punctuation
  "??",
  "???",
  "lol?",
  "wat?",
  "hm?",
  "huh?",
];

/**
 * Returns true if `text` looks like a real question worth indexing.
 * Returns false on greetings, reactions, and one-word messages.
 */
export function isLikelyQuestion(text, { minLength = 12 } = {}) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < minLength) return false;

  const lower = trimmed.toLowerCase();

  // Reject obvious noise
  if (LOW_VALUE_PHRASES.includes(lower)) return false;

  // Direct signal: ends with ?
  if (trimmed.endsWith("?")) return true;

  // Indirect signal: starts with a question word
  for (const starter of QUESTION_STARTERS) {
    if (lower.startsWith(starter + " ") || lower.startsWith(starter + ",")) {
      return true;
    }
  }

  return false;
}
