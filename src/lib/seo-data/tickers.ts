/**
 * Curated tickers that get their own indexable landing page under /stocks/[symbol].
 * Deliberately a hand-picked set of well-known names (not an exhaustive market
 * dump) so each page is high-quality and the set stays maintainable. Blurbs are
 * intentionally short and factual.
 */

export type AssetClass = "stock" | "etf" | "crypto" | "index";

export type Ticker = {
  /** Canonical symbol as ChartIt expects it (e.g. "AAPL", "BTC-USD", "^GSPC"). */
  symbol: string;
  name: string;
  assetClass: AssetClass;
  blurb: string;
};

export const ASSET_LABELS: Record<AssetClass, string> = {
  stock: "Stocks",
  etf: "ETFs",
  crypto: "Crypto",
  index: "Indices",
};

export const TICKERS: Ticker[] = [
  // ── Stocks ──────────────────────────────────────────────────────────────
  { symbol: "AAPL", name: "Apple", assetClass: "stock", blurb: "Consumer electronics, software, and services." },
  { symbol: "MSFT", name: "Microsoft", assetClass: "stock", blurb: "Software, cloud computing, and enterprise tools." },
  { symbol: "NVDA", name: "NVIDIA", assetClass: "stock", blurb: "GPUs and accelerated computing for AI and graphics." },
  { symbol: "AMZN", name: "Amazon", assetClass: "stock", blurb: "E-commerce and cloud computing (AWS)." },
  { symbol: "GOOGL", name: "Alphabet", assetClass: "stock", blurb: "Google search, advertising, and cloud." },
  { symbol: "META", name: "Meta Platforms", assetClass: "stock", blurb: "Social media and digital advertising." },
  { symbol: "TSLA", name: "Tesla", assetClass: "stock", blurb: "Electric vehicles and energy storage." },
  { symbol: "AVGO", name: "Broadcom", assetClass: "stock", blurb: "Semiconductors and infrastructure software." },
  { symbol: "JPM", name: "JPMorgan Chase", assetClass: "stock", blurb: "Banking and financial services." },
  { symbol: "V", name: "Visa", assetClass: "stock", blurb: "Global payments network." },
  { symbol: "MA", name: "Mastercard", assetClass: "stock", blurb: "Global payments technology." },
  { symbol: "BAC", name: "Bank of America", assetClass: "stock", blurb: "Banking and financial services." },
  { symbol: "UNH", name: "UnitedHealth", assetClass: "stock", blurb: "Health insurance and healthcare services." },
  { symbol: "JNJ", name: "Johnson & Johnson", assetClass: "stock", blurb: "Pharmaceuticals and medical devices." },
  { symbol: "LLY", name: "Eli Lilly", assetClass: "stock", blurb: "Pharmaceuticals." },
  { symbol: "XOM", name: "ExxonMobil", assetClass: "stock", blurb: "Oil, gas, and energy." },
  { symbol: "CVX", name: "Chevron", assetClass: "stock", blurb: "Oil, gas, and energy." },
  { symbol: "WMT", name: "Walmart", assetClass: "stock", blurb: "Retail and e-commerce." },
  { symbol: "COST", name: "Costco", assetClass: "stock", blurb: "Membership warehouse retail." },
  { symbol: "HD", name: "Home Depot", assetClass: "stock", blurb: "Home improvement retail." },
  { symbol: "MCD", name: "McDonald's", assetClass: "stock", blurb: "Quick-service restaurants." },
  { symbol: "KO", name: "Coca-Cola", assetClass: "stock", blurb: "Beverages." },
  { symbol: "PEP", name: "PepsiCo", assetClass: "stock", blurb: "Beverages and snacks." },
  { symbol: "DIS", name: "Disney", assetClass: "stock", blurb: "Media, entertainment, and theme parks." },
  { symbol: "NFLX", name: "Netflix", assetClass: "stock", blurb: "Streaming entertainment." },
  { symbol: "AMD", name: "AMD", assetClass: "stock", blurb: "CPUs and GPUs." },
  { symbol: "INTC", name: "Intel", assetClass: "stock", blurb: "Semiconductors." },
  { symbol: "BA", name: "Boeing", assetClass: "stock", blurb: "Aerospace and defense." },
  { symbol: "CAT", name: "Caterpillar", assetClass: "stock", blurb: "Construction and mining equipment." },
  { symbol: "GE", name: "GE Aerospace", assetClass: "stock", blurb: "Aerospace engines and systems." },
  { symbol: "PYPL", name: "PayPal", assetClass: "stock", blurb: "Digital payments." },
  { symbol: "ADBE", name: "Adobe", assetClass: "stock", blurb: "Creative and document software." },
  { symbol: "CRM", name: "Salesforce", assetClass: "stock", blurb: "Customer relationship management software." },
  { symbol: "ORCL", name: "Oracle", assetClass: "stock", blurb: "Database and cloud software." },
  { symbol: "PLTR", name: "Palantir", assetClass: "stock", blurb: "Data analytics software." },
  { symbol: "COIN", name: "Coinbase", assetClass: "stock", blurb: "Cryptocurrency exchange." },
  { symbol: "UBER", name: "Uber", assetClass: "stock", blurb: "Ride-hailing and delivery." },
  { symbol: "BRK-B", name: "Berkshire Hathaway", assetClass: "stock", blurb: "Diversified holding company." },

  // ── ETFs ────────────────────────────────────────────────────────────────
  { symbol: "SPY", name: "SPDR S&P 500 ETF", assetClass: "etf", blurb: "Tracks the S&P 500 index." },
  { symbol: "QQQ", name: "Invesco QQQ", assetClass: "etf", blurb: "Tracks the Nasdaq-100 index." },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", assetClass: "etf", blurb: "Tracks the S&P 500 index." },
  { symbol: "VTI", name: "Vanguard Total Market ETF", assetClass: "etf", blurb: "Tracks the total US stock market." },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", assetClass: "etf", blurb: "Tracks US small-cap stocks." },
  { symbol: "DIA", name: "SPDR Dow Jones ETF", assetClass: "etf", blurb: "Tracks the Dow Jones Industrial Average." },

  // ── Crypto ──────────────────────────────────────────────────────────────
  { symbol: "BTC-USD", name: "Bitcoin", assetClass: "crypto", blurb: "The original cryptocurrency." },
  { symbol: "ETH-USD", name: "Ethereum", assetClass: "crypto", blurb: "Smart-contract blockchain platform." },
  { symbol: "BNB-USD", name: "BNB", assetClass: "crypto", blurb: "Token of the BNB Chain ecosystem." },
  { symbol: "SOL-USD", name: "Solana", assetClass: "crypto", blurb: "High-throughput blockchain platform." },
  { symbol: "XRP-USD", name: "XRP", assetClass: "crypto", blurb: "Payments-focused digital asset." },
  { symbol: "ADA-USD", name: "Cardano", assetClass: "crypto", blurb: "Proof-of-stake blockchain platform." },
  { symbol: "DOGE-USD", name: "Dogecoin", assetClass: "crypto", blurb: "Meme-origin cryptocurrency." },
  { symbol: "AVAX-USD", name: "Avalanche", assetClass: "crypto", blurb: "Smart-contract blockchain platform." },
  { symbol: "DOT-USD", name: "Polkadot", assetClass: "crypto", blurb: "Multi-chain interoperability protocol." },
  { symbol: "LINK-USD", name: "Chainlink", assetClass: "crypto", blurb: "Decentralized oracle network." },
  { symbol: "LTC-USD", name: "Litecoin", assetClass: "crypto", blurb: "Peer-to-peer cryptocurrency." },
  { symbol: "BCH-USD", name: "Bitcoin Cash", assetClass: "crypto", blurb: "Peer-to-peer cryptocurrency." },
  { symbol: "MATIC-USD", name: "Polygon", assetClass: "crypto", blurb: "Ethereum scaling ecosystem." },
  { symbol: "UNI-USD", name: "Uniswap", assetClass: "crypto", blurb: "Decentralized exchange protocol token." },

  // ── Indices ─────────────────────────────────────────────────────────────
  { symbol: "^GSPC", name: "S&P 500", assetClass: "index", blurb: "Index of 500 large US companies." },
  { symbol: "^IXIC", name: "Nasdaq Composite", assetClass: "index", blurb: "Index of Nasdaq-listed stocks." },
  { symbol: "^DJI", name: "Dow Jones", assetClass: "index", blurb: "Index of 30 large US companies." },
  { symbol: "^RUT", name: "Russell 2000", assetClass: "index", blurb: "Index of US small-cap stocks." },
];

/** URL slug for a ticker (lowercase, "^" stripped). */
export function tickerSlug(symbol: string): string {
  return symbol.replace(/^\^/, "").toLowerCase();
}

export function getTicker(slug: string): Ticker | undefined {
  const s = slug.toLowerCase();
  return TICKERS.find((t) => tickerSlug(t.symbol) === s);
}

/** Other tickers in the same asset class, for "related" links. */
export function relatedTickers(t: Ticker, limit = 6): Ticker[] {
  return TICKERS.filter((x) => x.assetClass === t.assetClass && x.symbol !== t.symbol).slice(0, limit);
}
