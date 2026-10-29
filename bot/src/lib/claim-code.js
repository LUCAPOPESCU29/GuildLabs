/**
 * Claim-code helpers — must stay in sync with the site's
 * `src/lib/construct-claim-store.ts` (same alphabet + normalization) so a code
 * shown on the site resolves to the same canonical key the bot redeems with.
 */

/** "abcd-1234" / " ABCD1234 " → canonical "ABCD1234". */
export function normalizeCode(raw) {
  return String(raw ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
}
