/**
 * Ticker validation + normalization.
 *
 * Yahoo Finance symbols cover:
 *   - Stocks / ETFs:  AAPL, MSFT, SPY, BRK-B
 *   - Crypto:         BTC-USD, ETH-USD, DOGE-USD
 *   - Indices:        ^GSPC, ^IXIC   (carets allowed)
 *   - Forex:          EURUSD=X       (= and X allowed)
 *
 * We uppercase, trim a leading "$" (common in chat: "$AAPL"), and accept the
 * limited character set Yahoo uses. We do NOT guess crypto pairs here — the
 * data layer surfaces a clean "unknown symbol" error if Yahoo doesn't know it.
 */

const SYMBOL_RE = /^[A-Z0-9.^=-]{1,15}$/;

/** Returns a cleaned symbol, or null if it can't possibly be valid. */
export function normalizeSymbol(input) {
  if (typeof input !== "string") return null;
  let s = input.trim().toUpperCase();
  if (s.startsWith("$")) s = s.slice(1);
  s = s.replace(/\s+/g, "");
  if (!s || !SYMBOL_RE.test(s)) return null;
  return s;
}

/** Normalize a comma/space separated list into a unique, valid symbol array. */
export function normalizeSymbolList(input, max = 25) {
  if (typeof input !== "string") return [];
  const parts = input.split(/[\s,]+/).map(normalizeSymbol).filter(Boolean);
  return [...new Set(parts)].slice(0, max);
}
