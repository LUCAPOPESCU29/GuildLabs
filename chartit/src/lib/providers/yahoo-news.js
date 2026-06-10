/**
 * Yahoo Finance news provider — uses the public search endpoint, which returns
 * recent headlines for a ticker alongside (unused here) quote matches:
 *
 *   https://query1.finance.yahoo.com/v1/finance/search?q=AAPL&newsCount=3&quotesCount=0
 *
 * Keyless, same defensive shape as yahoo.js: browser-like UA, query1→query2
 * host fallback, and a bounded per-host timeout. News is a nice-to-have garnish
 * on /chart, so callers treat any failure as "no headlines" rather than an error.
 */

export const name = "yahoo-news";

const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const PER_HOST_TIMEOUT_MS = 6000;

/**
 * @param {string} symbol
 * @param {number} count
 * @returns {Promise<{title:string, publisher:string, link:string, publishedAt:number|null}[]>}
 */
export async function news(symbol, count = 3) {
  const qs = new URLSearchParams({
    q: symbol,
    newsCount: String(count),
    quotesCount: "0",
    enableFuzzyQuery: "false",
  });
  const path = `/v1/finance/search?${qs}`;

  let lastErr;
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(PER_HOST_TIMEOUT_MS),
      });
      if (!res.ok) {
        lastErr = new Error(`yahoo-news HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
      const items = Array.isArray(json?.news) ? json.news : [];
      return items
        .filter((n) => n?.title && n?.link)
        .slice(0, count)
        .map((n) => ({
          title: String(n.title),
          publisher: n.publisher ? String(n.publisher) : "",
          link: String(n.link),
          publishedAt:
            typeof n.providerPublishTime === "number" ? n.providerPublishTime * 1000 : null,
        }));
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("yahoo-news: unreachable");
}
