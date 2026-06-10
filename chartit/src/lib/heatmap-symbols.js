/**
 * Curated symbol sets for the /heatmap command.
 *
 * These are deliberately SHORT, hand-picked lists — not the full S&P 500 or the
 * entire crypto market — so the whole heatmap is one batched getQuotes() call
 * and stays gentle on the upstream data sources. They aim to be representative
 * (large-caps across sectors / top coins by market cap), not exhaustive.
 */

// ~30 US mega-caps spread across sectors (tech, finance, health, energy,
// consumer, industrial) so the grid reads like a broad market snapshot.
export const STOCKS = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AVGO",
  "JPM", "V", "MA", "BAC",
  "UNH", "JNJ", "LLY", "PFE",
  "XOM", "CVX",
  "WMT", "COST", "HD", "MCD", "KO", "PEP",
  "DIS", "NFLX",
  "BA", "CAT", "GE",
  "AMD",
];

// ~20 top crypto assets (Yahoo's -USD pairs).
export const CRYPTO = [
  "BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD",
  "ADA-USD", "DOGE-USD", "AVAX-USD", "TRX-USD", "DOT-USD",
  "LINK-USD", "MATIC-USD", "TON-USD", "LTC-USD", "BCH-USD",
  "XLM-USD", "UNI-USD", "ATOM-USD", "ETC-USD", "FIL-USD",
];

export const MARKETS = {
  stocks: { label: "Stocks", symbols: STOCKS },
  crypto: { label: "Crypto", symbols: CRYPTO },
};
