/**
 * Per-bot command reference data. ChartIt's commands are transcribed directly
 * from the bot source (chartit/src/commands/*). Only bots with a complete,
 * accurate reference are listed here; the /docs hub links the others to their
 * product pages until their docs are written (no fabricated commands).
 */

export type CommandOption = {
  name: string;
  description: string;
  required?: boolean;
  choices?: string[];
};

export type Command = {
  /** Display name including subcommand, e.g. "alert add". */
  name: string;
  /** Anchor-safe id, e.g. "alert-add". */
  id: string;
  usage: string;
  description: string;
  options?: CommandOption[];
  examples: string[];
  permissions?: string;
};

export type CommandGroup = {
  name: string;
  summary: string;
  commands: Command[];
};

export type BotDocs = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  groups: CommandGroup[];
  faqs: { q: string; a: string }[];
};

const RANGE_CHOICES = ["1d", "5d", "1mo", "6mo", "1y", "ytd"];

const chartit: BotDocs = {
  slug: "chartit",
  name: "ChartIt",
  tagline: "Live stock & crypto charts in Discord",
  description:
    "ChartIt posts TradingView-style candlestick charts, live quotes, market heatmaps, comparisons, and price alerts right inside Discord — no API keys, completely free.",
  groups: [
    {
      name: "Charts & quotes",
      summary: "Pull a chart, a fast quote, a comparison, or a market heatmap.",
      commands: [
        {
          name: "chart",
          id: "chart",
          usage: "/chart symbol:<ticker> [range]",
          description:
            "Post a candlestick chart plus a live quote (price, change, day range, volume) and the latest headlines for a ticker.",
          options: [
            { name: "symbol", description: "Ticker — e.g. AAPL, MSFT, BTC-USD", required: true },
            { name: "range", description: "Time range (default 1 month)", choices: RANGE_CHOICES },
          ],
          examples: ["/chart symbol:AAPL", "/chart symbol:BTC-USD range:1y"],
        },
        {
          name: "quote",
          id: "quote",
          usage: "/quote symbol:<ticker>",
          description: "Get a fast text-only quote for a stock or crypto ticker.",
          options: [{ name: "symbol", description: "Ticker — e.g. AAPL, MSFT, BTC-USD", required: true }],
          examples: ["/quote symbol:TSLA"],
        },
        {
          name: "compare",
          id: "compare",
          usage: "/compare symbols:<tickers> [range]",
          description:
            "Overlay 2–5 tickers on one chart, each normalized to its percent change so differently-priced assets are comparable.",
          options: [
            { name: "symbols", description: "2–5 tickers separated by spaces or commas", required: true },
            { name: "range", description: "Time range (default 1 month)", choices: RANGE_CHOICES },
          ],
          examples: ["/compare symbols:AAPL TSLA NVDA", "/compare symbols:BTC-USD ETH-USD range:6mo"],
        },
        {
          name: "heatmap",
          id: "heatmap",
          usage: "/heatmap [market]",
          description: "Post a colorful market heatmap of daily percent change.",
          options: [{ name: "market", description: "Which market", choices: ["stocks", "crypto"] }],
          examples: ["/heatmap", "/heatmap market:crypto"],
        },
        {
          name: "news",
          id: "news",
          usage: "/news symbol:<ticker>",
          description: "Show the latest three headlines for a stock or crypto ticker.",
          options: [{ name: "symbol", description: "Ticker — e.g. AAPL, MSFT, BTC-USD", required: true }],
          examples: ["/news symbol:NVDA"],
        },
      ],
    },
    {
      name: "Your tracker",
      summary: "A personal portfolio, and a server-wide auto-posting watchlist.",
      commands: [
        {
          name: "portfolio",
          id: "portfolio",
          usage: "/portfolio add|remove|show|clear",
          description:
            "Your own personal watchlist (per user). Add tickers and see them all with live prices, sorted by performance.",
          options: [{ name: "symbol", description: "Ticker to add or remove (for add/remove)" }],
          examples: ["/portfolio add symbol:AAPL", "/portfolio show"],
        },
        {
          name: "watchlist",
          id: "watchlist",
          usage: "/watchlist add|remove|list|channel|interval|range|hours",
          description:
            "Auto-post charts for a set of tickers to a channel on a schedule. Configure the channel, interval, range, and whether to post only during US market hours.",
          permissions: "Manage Server",
          examples: ["/watchlist add symbol:AAPL", "/watchlist channel channel:#markets", "/watchlist interval minutes:60"],
        },
      ],
    },
    {
      name: "Alerts",
      summary: "Get pinged when a price crosses a threshold — in a channel or your DMs.",
      commands: [
        {
          name: "alert",
          id: "alert",
          usage: "/alert add|list|remove",
          description:
            "Create price alerts that fire when a ticker crosses a threshold. Choose target: a channel ping (needs Manage Server) or a personal DM alert any member can set.",
          permissions: "Channel alerts: Manage Server · DM alerts: anyone",
          options: [
            { name: "symbol", description: "Ticker — e.g. TSLA or BTC-USD", required: true },
            { name: "direction", description: "Trigger when price goes above or below", required: true, choices: ["above", "below"] },
            { name: "price", description: "Threshold price", required: true },
            { name: "target", description: "Where the alert fires", choices: ["this channel", "DM me"] },
          ],
          examples: ["/alert add symbol:BTC-USD direction:above price:80000 target:DM me", "/alert list"],
        },
      ],
    },
    {
      name: "Help",
      summary: "Find your way around.",
      commands: [
        {
          name: "chartit",
          id: "chartit",
          usage: "/chartit",
          description: "Show ChartIt's help — a quick overview of every command.",
          examples: ["/chartit"],
        },
      ],
    },
  ],
  faqs: [
    {
      q: "Does ChartIt need an API key?",
      a: "No. ChartIt uses free, keyless market data sources, so there's nothing to configure — add it and run /chart.",
    },
    {
      q: "What symbols are supported?",
      a: "Stocks and ETFs (AAPL, SPY), crypto (BTC-USD, ETH-USD), indices (^GSPC), and forex (EURUSD=X).",
    },
    {
      q: "Is ChartIt free?",
      a: "Yes — every command is free to use.",
    },
    {
      q: "Can normal members set price alerts?",
      a: "Yes. Anyone can create a personal DM alert with /alert add … target: DM me. Channel-wide alerts require the Manage Server permission.",
    },
    {
      q: "Is this financial advice?",
      a: "No. ChartIt shows public market data for informational purposes only and does not place trades.",
    },
  ],
};

export const DOCS: BotDocs[] = [chartit];

export function getBotDocs(slug: string): BotDocs | undefined {
  return DOCS.find((d) => d.slug === slug);
}

/** Bots shown on the /docs hub. `documented` ones link to a full reference. */
export const DOC_BOTS: { slug: string; name: string; tagline: string; documented: boolean; productPath: string }[] = [
  { slug: "chartit", name: "ChartIt", tagline: "Live stock & crypto charts", documented: true, productPath: "/bots/chartit" },
  { slug: "construct", name: "Construct", tagline: "Build & manage your server", documented: false, productPath: "/bots/construct" },
  { slug: "maven", name: "Maven", tagline: "Community engagement", documented: false, productPath: "/bots/maven" },
];
