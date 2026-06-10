/**
 * Guides / blog content. Posts are authored as typed, structured blocks (not
 * MDX) so they render with a fixed, on-design component set and require no extra
 * build tooling. Each post links out to related product pages for internal-link
 * depth.
 */

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h2"; id: string; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "code"; code: string }
  | { type: "callout"; text: string };

export type GuidePost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  author: string;
  tags: string[];
  readingMinutes: number;
  body: GuideBlock[];
  relatedLinks: { label: string; href: string }[];
};

export const GUIDES: GuidePost[] = [
  {
    slug: "how-to-add-a-stock-chart-bot-to-discord",
    title: "How to add a stock chart bot to Discord",
    description:
      "A step-by-step guide to adding a free stock and crypto chart bot to your Discord server — and posting your first chart in under a minute.",
    date: "2026-06-08",
    author: "GuildLabs",
    tags: ["ChartIt", "Setup", "Stocks"],
    readingMinutes: 4,
    body: [
      { type: "p", text: "Want live stock and crypto charts right inside your Discord server? This guide walks through adding ChartIt — a free, no-API-key chart bot — and posting your first chart in under a minute." },
      { type: "h2", id: "what-you-need", text: "What you'll need" },
      { type: "list", items: ["A Discord server where you have the Manage Server permission", "About one minute"] },
      { type: "h2", id: "steps", text: "Add the bot" },
      { type: "steps", items: [
        "Open the ChartIt invite link and choose your server from the dropdown.",
        "Approve the permissions (ChartIt only needs to read commands and send messages with embeds).",
        "Back in Discord, type /chart and pick the command.",
        "Enter a ticker — for example AAPL or BTC-USD — and send it.",
      ] },
      { type: "p", text: "That's it. ChartIt posts a candlestick chart with a live quote and the latest headlines. No account, no configuration, no API key." },
      { type: "h2", id: "next", text: "Useful next commands" },
      { type: "list", items: [
        "/quote symbol:TSLA — a fast text quote",
        "/compare symbols:AAPL MSFT NVDA — overlay several tickers",
        "/heatmap — a colorful market heatmap",
        "/alert add symbol:BTC-USD direction:above price:80000 — get pinged on a price",
      ] },
      { type: "callout", text: "Tip: any member can set a personal DM price alert with /alert add … target: DM me — no admin permission needed." },
    ],
    relatedLinks: [
      { label: "ChartIt command reference", href: "/docs/chartit" },
      { label: "Browse live charts by ticker", href: "/stocks" },
    ],
  },
  {
    slug: "best-finance-bots-for-trading-servers",
    title: "Best finance bots for Discord trading servers",
    description:
      "What to look for in a Discord finance bot, and how to pick the right one for a trading or investing community.",
    date: "2026-06-08",
    author: "GuildLabs",
    tags: ["Stocks", "Crypto", "Community"],
    readingMinutes: 5,
    body: [
      { type: "p", text: "If you run a trading or investing Discord, the right bot keeps charts, quotes, and alerts where your conversation already happens. Here's what actually matters when choosing one." },
      { type: "h2", id: "what-to-look-for", text: "What to look for" },
      { type: "list", items: [
        "Charts in the channel — not just a link out to a website",
        "Both stocks and crypto, plus ETFs and indices",
        "Price alerts that can ping a channel or DM a member",
        "No paywall or API key for the basics",
        "Clean, readable output that doesn't spam the channel",
      ] },
      { type: "h2", id: "chartit", text: "ChartIt" },
      { type: "p", text: "ChartIt covers all of the above for free: candlestick charts, quotes, multi-ticker comparisons, market heatmaps, headlines, personal portfolios, and channel-or-DM price alerts — all as slash commands with no setup." },
      { type: "h2", id: "pairing", text: "Pairing tools" },
      { type: "p", text: "For deep, hands-on technical analysis, a dedicated web platform like TradingView is more powerful. Many communities use both: TradingView for analysis, ChartIt to bring the charts and alerts into Discord." },
      { type: "callout", text: "Rule of thumb: pick the bot that posts what your members ask for in one command, without anyone leaving Discord." },
    ],
    relatedLinks: [
      { label: "ChartIt vs TradingView", href: "/vs/chartit-vs-tradingview" },
      { label: "Add a chart bot to Discord", href: "/guides/how-to-add-a-stock-chart-bot-to-discord" },
    ],
  },
  {
    slug: "how-to-set-up-price-alerts-in-discord",
    title: "How to set up price alerts in Discord",
    description:
      "Set channel and personal DM price alerts in Discord with ChartIt so you never miss a move — no app, no API key.",
    date: "2026-06-08",
    author: "GuildLabs",
    tags: ["ChartIt", "Alerts", "Crypto"],
    readingMinutes: 3,
    body: [
      { type: "p", text: "Price alerts let you (or your whole server) get notified the moment a ticker crosses a price. With ChartIt you can set them in seconds — to a channel or straight to your DMs." },
      { type: "h2", id: "channel-alerts", text: "Channel alerts" },
      { type: "p", text: "Channel alerts ping a chosen channel and require the Manage Server permission. Use them for server-wide levels everyone watches." },
      { type: "code", code: "/alert add symbol:BTC-USD direction:above price:80000 target:this channel" },
      { type: "h2", id: "dm-alerts", text: "Personal DM alerts" },
      { type: "p", text: "Any member can create a personal alert that DMs them — no special permission needed. Great for your own watch levels without cluttering a channel." },
      { type: "code", code: "/alert add symbol:AAPL direction:below price:180 target:DM me" },
      { type: "callout", text: "Make sure your DMs from server members are open, or the bot can't reach you. Manage everything with /alert list and /alert remove." },
    ],
    relatedLinks: [
      { label: "ChartIt /alert docs", href: "/docs/chartit" },
      { label: "Track a ticker", href: "/stocks" },
    ],
  },
];

export function getGuide(slug: string): GuidePost | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
