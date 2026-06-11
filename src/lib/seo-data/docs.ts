/**
 * Per-bot command reference data. Commands are transcribed directly from each
 * bot's source (chartit/src/commands/*, bot/src/commands/* for Construct,
 * maven/src/commands/* for Maven) — no fabricated commands. Troubleshooting
 * lives in each bot's FAQ section.
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
      q: "Troubleshooting: a ticker returns \"not found\"",
      a: "Use the exchange-style symbol: crypto pairs need the -USD suffix (BTC-USD, not BTC), indices need a caret (^GSPC for the S&P 500), and forex pairs end in =X (EURUSD=X). If a stock symbol fails, check it against Yahoo Finance's spelling.",
    },
    {
      q: "Troubleshooting: my DM alert never arrived",
      a: "Discord blocks DMs from server bots when \"Allow direct messages from server members\" is off for that server. Enable it (right-click the server → Privacy Settings), then check your alert still exists with /alert list — alerts fire once and are removed after triggering.",
    },
    {
      q: "Troubleshooting: the watchlist stopped posting",
      a: "Check three things: the configured channel still exists (/watchlist channel to re-set it), ChartIt can send messages and embed links in that channel, and market-hours mode isn't on while the US market is closed (/watchlist hours).",
    },
    {
      q: "Is this financial advice?",
      a: "No. ChartIt shows public market data for informational purposes only and does not place trades.",
    },
  ],
};

const construct: BotDocs = {
  slug: "construct",
  name: "Construct",
  tagline: "Build & manage your Discord server",
  description:
    "Construct deploys blueprints from the GuildLabs builder — roles, categories, channels, permissions — and then runs the essentials: verification, anti-raid, welcome messages, tickets, and XP leveling. Free and open-source.",
  groups: [
    {
      name: "Deploy",
      summary: "Turn a builder blueprint into a live server in seconds.",
      commands: [
        {
          name: "setup",
          id: "setup",
          usage: "/setup blueprint:<file>",
          description:
            "Deploy a GuildLabs blueprint JSON to this server. Construct creates the roles, categories, and channels in the file — anything with a matching name is skipped, and nothing is ever deleted. Takes 10–30 seconds depending on size.",
          permissions: "Administrator",
          options: [
            { name: "blueprint", description: "The blueprint.json exported from the GuildLabs builder (Download JSON on any template, or Export in the wizard)", required: true },
          ],
          examples: ["/setup blueprint:blueprint.json"],
        },
        {
          name: "diagnose",
          id: "diagnose",
          usage: "/diagnose",
          description:
            "A health check: verifies Construct has the permissions it needs (Manage Roles, Manage Channels, and more), that its role sits high enough in the role list, and which features are configured. Run this first whenever something misbehaves.",
          permissions: "Administrator",
          examples: ["/diagnose"],
        },
      ],
    },
    {
      name: "Configure",
      summary: "Switch on the server essentials, one subcommand each.",
      commands: [
        {
          name: "config welcome",
          id: "config-welcome",
          usage: "/config welcome channel:<channel> [message]",
          description:
            "Set the channel (and optional template) for welcome messages. The message supports {user} (a mention), {username}, and {server} placeholders.",
          permissions: "Administrator",
          options: [
            { name: "channel", description: "Channel to send welcome messages in", required: true },
            { name: "message", description: "Custom message — use {user}, {server}, {username}" },
          ],
          examples: ["/config welcome channel:#welcome message:Hey {user}, welcome to {server}!"],
        },
        {
          name: "config verification",
          id: "config-verification",
          usage: "/config verification channel:<channel> role:<role>",
          description:
            "Set up a verification gate: pick the channel where the Verify panel lives and the role members receive when they click the button. Pair with channel permissions so unverified members can only see the gate.",
          permissions: "Administrator",
          options: [
            { name: "channel", description: "Channel where the verify panel will be posted", required: true },
            { name: "role", description: "Role granted after a member verifies", required: true },
          ],
          examples: ["/config verification channel:#verify role:@Member"],
        },
        {
          name: "config antiraid",
          id: "config-antiraid",
          usage: "/config antiraid enabled:<true|false> [threshold]",
          description:
            "Configure anti-raid protection. When more than the threshold of accounts join within 10 seconds, Construct takes action against the flood.",
          permissions: "Administrator",
          options: [
            { name: "enabled", description: "Enable or disable", required: true },
            { name: "threshold", description: "Joins per 10s before action (default 10)" },
          ],
          examples: ["/config antiraid enabled:true threshold:8"],
        },
        {
          name: "config leveling",
          id: "config-leveling",
          usage: "/config leveling enabled:<true|false> [announce]",
          description:
            "Enable XP leveling. Members earn XP by chatting; level-ups are announced in the channel you choose (or inline where they happen).",
          permissions: "Administrator",
          options: [
            { name: "enabled", description: "Enable or disable", required: true },
            { name: "announce", description: "Channel to announce level-ups (optional)" },
          ],
          examples: ["/config leveling enabled:true announce:#level-ups"],
        },
        {
          name: "config tickets",
          id: "config-tickets",
          usage: "/config tickets category:<category> support_role:<role>",
          description:
            "Set up the ticket system: choose the category where private ticket channels are created and the role that can see and reply to them.",
          permissions: "Administrator",
          options: [
            { name: "category", description: "Category that ticket channels will be created in", required: true },
            { name: "support_role", description: "Role that can see and reply to tickets", required: true },
          ],
          examples: ["/config tickets category:Support support_role:@Mod"],
        },
        {
          name: "config show",
          id: "config-show",
          usage: "/config show",
          description: "Show the current Construct configuration for this server — every feature and where it points.",
          permissions: "Administrator",
          examples: ["/config show"],
        },
        {
          name: "verify-panel",
          id: "verify-panel",
          usage: "/verify-panel",
          description:
            "Post (or re-post) the Verify button in the configured verification channel. Run /config verification first.",
          permissions: "Administrator",
          examples: ["/verify-panel"],
        },
      ],
    },
    {
      name: "For members",
      summary: "Commands anyone in the server can use.",
      commands: [
        {
          name: "ticket",
          id: "ticket",
          usage: "/ticket",
          description:
            "Open a private support ticket — a channel only you and the support role can see, with a Close Ticket button when you're done. One open ticket per member.",
          examples: ["/ticket"],
        },
        {
          name: "rank",
          id: "rank",
          usage: "/rank [user]",
          description: "Check your XP, level, and progress to the next level — or look up someone else's.",
          options: [{ name: "user", description: "Whose rank to look up (defaults to you)" }],
          examples: ["/rank", "/rank user:@friend"],
        },
        {
          name: "leaderboard",
          id: "leaderboard",
          usage: "/leaderboard",
          description: "Show the top XP earners in this server.",
          examples: ["/leaderboard"],
        },
      ],
    },
  ],
  faqs: [
    {
      q: "Will /setup overwrite or delete anything?",
      a: "No. Deploys are additive-only: Construct creates what's in the blueprint and skips anything with a matching name. It never deletes or modifies existing roles or channels.",
    },
    {
      q: "Why does Construct ask for Administrator?",
      a: "It creates roles and channels and sets their permissions, which requires Manage Roles and Manage Channels at minimum; Administrator covers the moderation features (anti-raid) too. The bot is open-source, so you can read exactly what it does with the access.",
    },
    {
      q: "Where do I get a blueprint file?",
      a: "From the GuildLabs builder: describe your server (or pick a template), review the blueprint, then either deploy directly from the web or use Download JSON and run /setup with the file.",
    },
    {
      q: "Troubleshooting: /setup says it's missing permissions",
      a: "Construct needs Manage Roles and Manage Channels. Run /diagnose for the full checklist — it flags exactly which permissions are missing and whether the bot's role needs to be moved.",
    },
    {
      q: "Troubleshooting: roles deploy but members don't get colors/permissions",
      a: "Discord only lets a bot manage roles below its own highest role. Drag the Construct role to the top of Server Settings → Roles, then re-run /setup — already-created items are skipped, so it's safe.",
    },
    {
      q: "Troubleshooting: the Verify button does nothing",
      a: "Usually the configured role was deleted or is above Construct's role. Re-run /config verification with a valid role, make sure Construct's role sits above it, then /verify-panel to post a fresh panel.",
    },
    {
      q: "Troubleshooting: /rank says leveling is off",
      a: "Leveling is opt-in per server. An admin needs to run /config leveling enabled:true once; XP starts counting from that moment.",
    },
  ],
};

const maven: BotDocs = {
  slug: "maven",
  name: "Maven",
  tagline: "Past wisdom, recovered",
  description:
    "Maven indexes the questions and answers in the channels you choose. When someone asks something that's been answered before — similar in meaning, not just wording — it links them to the original answer. Runs on a local model: no API keys, no per-message cost, your data stays on your machine.",
  groups: [
    {
      name: "Find answers",
      summary: "Search the server's memory — or let Maven do it automatically.",
      commands: [
        {
          name: "maven search",
          id: "maven-search",
          usage: "/maven search query:<text>",
          description:
            "Search past questions in this server by meaning, not exact words. Returns the closest matches with links to the original threads.",
          options: [{ name: "query", description: "What are you trying to find? (max 280 characters)", required: true }],
          examples: ["/maven search query:how do I get the member role"],
        },
        {
          name: "maven stats",
          id: "maven-stats",
          usage: "/maven stats",
          description: "See how much wisdom is preserved here — how many questions Maven has indexed for this server.",
          examples: ["/maven stats"],
        },
        {
          name: "maven help",
          id: "maven-help",
          usage: "/maven help",
          description: "Show what Maven does and how to use it.",
          examples: ["/maven help"],
        },
      ],
    },
    {
      name: "Settings",
      summary: "Control where Maven listens and how it replies.",
      commands: [
        {
          name: "maven enable / disable",
          id: "maven-enable",
          usage: "/maven enable · /maven disable",
          description: "Turn Maven on or off for this server. When disabled, it neither indexes nor replies.",
          permissions: "Manage Server",
          examples: ["/maven enable", "/maven disable"],
        },
        {
          name: "maven watch / unwatch",
          id: "maven-watch",
          usage: "/maven watch channel:<channel> · /maven unwatch channel:<channel>",
          description:
            "Manage the channel allowlist. Maven only ever indexes and replies in channels you've explicitly added — everything else is invisible to it.",
          permissions: "Manage Server",
          options: [{ name: "channel", description: "Text channel to watch (or stop watching)", required: true }],
          examples: ["/maven watch channel:#help", "/maven unwatch channel:#off-topic"],
        },
        {
          name: "maven sensitivity",
          id: "maven-sensitivity",
          usage: "/maven sensitivity percent:<50–95>",
          description:
            "How close two questions must be to count as a repeat. Higher is stricter — fewer, more confident matches. Default is 78.",
          permissions: "Manage Server",
          options: [{ name: "percent", description: "Match threshold, 50–95 (default 78)", required: true }],
          examples: ["/maven sensitivity percent:85"],
        },
        {
          name: "maven reply",
          id: "maven-reply",
          usage: "/maven reply mode:<public|quiet|off>",
          description:
            "How Maven responds when it finds a repeat: public (visible to everyone), quiet (auto-deletes after 60 seconds), or off (never reply, just keep indexing).",
          permissions: "Manage Server",
          options: [
            { name: "mode", description: "Reply mode", required: true, choices: ["public", "quiet", "off"] },
          ],
          examples: ["/maven reply mode:quiet"],
        },
        {
          name: "maven show",
          id: "maven-show",
          usage: "/maven show",
          description: "Show Maven's current settings — enabled state, watched channels, sensitivity, and reply mode.",
          permissions: "Manage Server",
          examples: ["/maven show"],
        },
      ],
    },
    {
      name: "Manage the index",
      summary: "Backfill history and remove entries.",
      commands: [
        {
          name: "maven import",
          id: "maven-import",
          usage: "/maven import channel:<channel> [messages]",
          description:
            "Scan a channel's recent history and index past questions — between 100 and 5,000 messages back. Great for giving Maven a memory on day one instead of starting from zero.",
          permissions: "Manage Server",
          options: [
            { name: "channel", description: "Channel to import from", required: true },
            { name: "messages", description: "How many messages back to scan, 100–5000 (default applies if omitted)" },
          ],
          examples: ["/maven import channel:#help messages:2000"],
        },
        {
          name: "maven forget",
          id: "maven-forget",
          usage: "/maven forget link:<message link>",
          description:
            "Remove a specific question from the index. Right-click the message → Copy Message Link and paste it here.",
          permissions: "Manage Server",
          options: [{ name: "link", description: "Right-click message → Copy Message Link", required: true }],
          examples: ["/maven forget link:https://discord.com/channels/…"],
        },
      ],
    },
  ],
  faqs: [
    {
      q: "Does Maven send my server's messages to an AI company?",
      a: "No. Maven is self-hosted and runs a local embedding model — questions are indexed and matched on your own machine. Nothing leaves it, and there's no API bill, which is why Maven is free.",
    },
    {
      q: "Does Maven read every channel?",
      a: "No. It only sees channels you explicitly add with /maven watch. Everything else is invisible to it, and /maven unwatch removes a channel at any time.",
    },
    {
      q: "How does matching work — exact words?",
      a: "By meaning. \"How do I get the member role\" matches \"where do roles come from\" if they're semantically close enough. The /maven sensitivity threshold (default 78%) controls how close is close enough.",
    },
    {
      q: "Can Maven learn from messages sent before it joined?",
      a: "Yes — /maven import scans up to 5,000 messages of a channel's history and indexes the questions it finds, so Maven is useful on day one.",
    },
    {
      q: "Troubleshooting: Maven never replies to repeat questions",
      a: "Check four things with /maven show: the server is enabled, the channel is on the watchlist, reply mode isn't set to off, and sensitivity isn't so high that nothing matches. Also confirm the index isn't empty with /maven stats — run /maven import if it is.",
    },
    {
      q: "Troubleshooting: Maven matches questions that aren't really repeats",
      a: "Raise the threshold: /maven sensitivity percent:85 (or higher, up to 95). Higher values require questions to be much closer in meaning before Maven replies. You can also remove a bad index entry with /maven forget.",
    },
    {
      q: "Troubleshooting: replies feel spammy in busy channels",
      a: "Switch to quiet mode — /maven reply mode:quiet auto-deletes Maven's reply after 60 seconds, so the asker sees the link but the channel stays clean. Or set mode:off to keep indexing silently and rely on /maven search.",
    },
  ],
};

export const DOCS: BotDocs[] = [chartit, construct, maven];

export function getBotDocs(slug: string): BotDocs | undefined {
  return DOCS.find((d) => d.slug === slug);
}

/** Bots shown on the /docs hub. `documented` ones link to a full reference. */
export const DOC_BOTS: { slug: string; name: string; tagline: string; documented: boolean; productPath: string }[] = [
  { slug: "chartit", name: "ChartIt", tagline: "Live stock & crypto charts", documented: true, productPath: "/bots/chartit" },
  { slug: "construct", name: "Construct", tagline: "Build & manage your server", documented: true, productPath: "/bots/construct" },
  { slug: "maven", name: "Maven", tagline: "Community engagement", documented: true, productPath: "/bots/maven" },
];
