/**
 * Product changelog. Entries are transcribed from the project's real git
 * history — no invented releases. Newest first.
 */

export type ChangeType = "added" | "improved" | "fixed";
export type BotTag = "ChartIt" | "Construct" | "Maven" | "Platform";

export type ChangelogEntry = {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  version?: string;
  bot: BotTag;
  title: string;
  summary: string;
  items: { type: ChangeType; text: string }[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-06-15",
    bot: "Platform",
    title: "Meet Queen — the studio's 4th bot (coming soon)",
    summary:
      "A teaser landed on the homepage for Queen, an in-server AI assistant — think ChatGPT living inside your Discord. @mention it or use /ask and it reasons in context, summarizes long threads, and is built to run on your own local model so messages never leave your server. It's distinct from Maven (which surfaces your community's own answered questions) — Queen is a general assistant. Join the waitlist to get early access.",
    items: [
      { type: "added", text: "Queen \"coming soon\" announcement on the homepage, with an early-access waitlist" },
      { type: "added", text: "Privacy-first by design — Queen is built to run on a local model, so chats stay in your server" },
    ],
  },
  {
    date: "2026-06-14",
    bot: "Platform",
    title: "Free tools — and a quiz that picks your server",
    summary:
      "Two new free tools, no sign-up. A visual embed builder lets you design rich Discord embeds with a faithful live preview and fire a test straight to a webhook. And a 30-second quiz matches you to the right server template, then drops you into the builder ready to generate. The bot pages got real \"try it live\" widgets too, so you can chart a ticker or ask Maven a question right on the site.",
    items: [
      { type: "added", text: "Embed builder — multiple embeds, markdown-rendered preview, live limit checks, presets, import/export, shareable links, and a one-click webhook test" },
      { type: "added", text: "\"What server should you build?\" quiz — an immersive, animated matcher that hands its pick straight to Construct" },
      { type: "added", text: "Live \"try it\" demos on the ChartIt and Maven pages, hitting the same data the bots use" },
      { type: "added", text: "A Free tools hub at /tools, linked from the nav" },
    ],
  },
  {
    date: "2026-06-14",
    bot: "Construct",
    title: "Deploy without leaving your server",
    summary:
      "Deploying used to need the site to reach your bot directly, which never worked once the bot lived anywhere but your own machine. Now it's inverted: the site gives you a short one-time code, you run /deploy with it in your server, and the bot pulls the blueprint and builds everything. We also fixed the roles it creates — they now get real Discord permissions instead of a best-guess.",
    items: [
      { type: "added", text: "Claim-code deploy — generate a code on the site, run /deploy in your server, done. Works wherever you run the bot, including on your own machine" },
      { type: "fixed", text: "Deployed roles now carry explicit Discord permissions per preset — no more roles created with the wrong access or none at all" },
    ],
  },
  {
    date: "2026-06-14",
    bot: "Platform",
    title: "More guides, comparisons, and a sturdier codebase",
    summary:
      "A big content pass: deeper comparison pages, more docs, and new how-to guides — all wired into the sitemap so they're findable. Behind the scenes, a test suite now guards the builder's core logic, and the on-site Maven assistant stopped inventing pricing (everything GuildLabs makes is free).",
    items: [
      { type: "improved", text: "Expanded comparisons, docs, and guides, plus polish across the site" },
      { type: "added", text: "An automated test suite covering blueprint validation, deploy, and rate-limiting" },
      { type: "fixed", text: "Maven no longer invents paid plans — it correctly says every GuildLabs tool is free and open-source" },
    ],
  },
  {
    date: "2026-06-12",
    bot: "Platform",
    title: "A homepage with depth — literally",
    summary:
      "The bot showcase got rebuilt as interactive 3D slides: each bot now sits on a tilting, depth-lit card you can move with your cursor. It's the same information as before, but browsing the lineup finally feels as fun as using the bots.",
    items: [
      { type: "added", text: "3D interactive bot slides — Construct, Maven, and ChartIt each get a glowing, pointer-tracked slide" },
      { type: "added", text: "Tilt-depth cards across the homepage that respond to your cursor (and stay still if you prefer reduced motion)" },
    ],
  },
  {
    date: "2026-06-11",
    bot: "Platform",
    title: "Phones deserve the good version too",
    summary:
      "A pass over the mobile experience: the navbar no longer spills past the screen edge on small phones, and the hero scene stopped eating frames. If the site felt heavy on your phone before, it shouldn't now.",
    items: [
      { type: "fixed", text: "Navbar no longer overflows the viewport on phones" },
      { type: "improved", text: "Cut hero-scene jank on mobile — fewer dropped frames while scrolling" },
      { type: "improved", text: "Lightened the navbar blur on phones, where heavy backdrop blur costs the most" },
    ],
  },
  {
    date: "2026-06-10",
    bot: "Platform",
    title: "The playground: try every bot without inviting anything",
    summary:
      "The biggest objection to adding a bot is having to add it first. The new playground is a Discord-style chat right on the site where you can run /build, /chart, and /ask against the real bots — no server, no invite, no sign-in. Build a blueprint in the playground and it hands off straight to the real builder for deploy.",
    items: [
      { type: "added", text: "Discord-style playground with working /build, /chart, and /ask slash commands" },
      { type: "added", text: "Playground blueprints hand off to the builder, so a /build experiment can become a real deploy" },
      { type: "added", text: "A bold homepage section with a live chat mock so the playground is impossible to miss" },
      { type: "improved", text: "The AI builder now honours requested counts — ask for 6 channels, get 6 channels" },
      { type: "fixed", text: "Deploy errors now distinguish a stale session or offline bot from \"you still need to invite the bot\" — no more wrong advice" },
    ],
  },
  {
    date: "2026-06-09",
    bot: "Construct",
    title: "Describe it. The AI builder is live.",
    summary:
      "The wizard is now optional: type what you want — \"a cozy art community with critique channels and events\" — and Construct designs the whole server as a reviewable blueprint. It runs on Groq for speed, and if the AI is ever unreachable, a built-in offline designer still produces a solid blueprint, so the builder never just fails. You always review and edit before anything touches your server.",
    items: [
      { type: "added", text: "\"Describe it\" AI mode — one sentence in, a full blueprint (roles, categories, channels, permissions) out" },
      { type: "added", text: "Offline fallback designer, so blueprint generation works even when the AI provider doesn't" },
      { type: "added", text: "A docs hub and step-by-step tutorials, plus a site-wide UI overhaul to match" },
      { type: "improved", text: "Hardened the AI builder after a security-focused code review" },
      { type: "fixed", text: "Sign-in with Discord now derives its callback from the request, fixing OAuth behind proxies and previews" },
      { type: "fixed", text: "The dashboard no longer caches bot guild data — what you see always reflects live state" },
    ],
  },
  {
    date: "2026-06-08",
    bot: "ChartIt",
    title: "Heatmaps, comparisons, news & personal alerts",
    summary:
      "This release is about the rest of your server, not just the person typing /chart. Heatmaps and comparisons give a channel something to argue about; headlines add the why behind the move; and personal DM alerts mean any member can watch their own levels without pinging — or needing permission from — anyone else.",
    items: [
      { type: "added", text: "/heatmap — a colorful market heatmap of daily % change for stocks or crypto" },
      { type: "added", text: "/compare — overlay 2–5 tickers on one normalized % change chart" },
      { type: "added", text: "/news — latest headlines for a ticker, plus headlines now appear under /chart" },
      { type: "added", text: "/portfolio — a personal, per-user watchlist with live prices" },
      { type: "added", text: "Personal DM price alerts — any member can set /alert … target: DM me" },
      { type: "improved", text: "Every chart and command now links back to a live web chart with ChartIt branding" },
    ],
  },
  {
    date: "2026-06-07",
    bot: "ChartIt",
    title: "TradingView-style drawing tools",
    summary:
      "Drawing on the web chart now works the way your hands expect from pro tools: click, drag, done. Fib retracements and rectangles snap out in one motion instead of click-click-adjust, and trend lines, rays, and arrows round out the kit.",
    items: [
      { type: "added", text: "Click-drag Fibonacci and rectangle tools" },
      { type: "added", text: "Trend lines, rays, and arrows" },
    ],
  },
  {
    date: "2026-06-06",
    bot: "ChartIt",
    title: "Indicators overhaul",
    summary:
      "More indicators, less clutter. The web chart gained a full suite of overlays and eleven stackable oscillator panes — and at the same time the toolbar went on a diet, folding about thirty pills into one tidy Indicators popover. More power, calmer screen.",
    items: [
      { type: "added", text: "Overlay indicators on the price chart" },
      { type: "added", text: "11 new oscillator panes you can stack" },
      { type: "improved", text: "Folded ~30 toolbar pills into a single, tidy Indicators popover" },
    ],
  },
  {
    date: "2026-06-05",
    bot: "ChartIt",
    title: "Pro charting release",
    summary:
      "The interactive web chart grew up. Everything you'd reach for on a paid charting platform — drawing tools, VWAP, EMA ribbons, bar replay, position tools, on-chart alerts — landed in one release, free, one click from any Discord chart ChartIt posts.",
    items: [
      { type: "added", text: "Drawing tools — horizontal/trend lines, Fibonacci retracements & extensions, channels" },
      { type: "added", text: "VWAP (and anchored VWAP), volume MA & profile, EMA ribbons with golden/death cross markers" },
      { type: "added", text: "Bar replay mode, measure tool, and PNG export" },
      { type: "added", text: "More chart types — Heikin-Ashi, hollow candles, and baseline" },
      { type: "added", text: "On-chart price alerts with browser notifications, plus long/short position tools" },
      { type: "improved", text: "Smarter rendering — thinner bars, eased zoom, and polished grid" },
    ],
  },
];
