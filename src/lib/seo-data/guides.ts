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
    slug: "how-to-set-up-a-gaming-discord-server",
    title: "How to set up a gaming Discord server",
    description:
      "The complete walkthrough for building a gaming Discord server — channels, roles, voice setup, LFG, and the bots worth adding — in about ten minutes.",
    date: "2026-06-10",
    author: "GuildLabs",
    tags: ["Setup", "Gaming", "Construct"],
    readingMinutes: 7,
    body: [
      { type: "p", text: "A good gaming server isn't a hundred channels — it's the right ten. This guide walks through the structure that works for everything from a five-friend squad to a multi-game community, plus the roles and voice setup that keep it from descending into chaos by week two." },
      { type: "h2", id: "structure", text: "The structure that works" },
      { type: "p", text: "Start with four categories. You can always add more later; you can almost never remove channels once people are using them." },
      { type: "list", items: [
        "INFO — #welcome, #rules, #announcements. Read-only for members. This is where new people orient themselves.",
        "GENERAL — #chat, #memes, #clips. The social core. Most messages happen here, keep it small.",
        "GAMES — one text channel per game you actually play, not per game that exists. #valorant, #minecraft, #lfg.",
        "VOICE — a couple of always-open lounges plus per-game voice channels sized to your party size (Duo, 5-Stack).",
      ] },
      { type: "callout", text: "Resist the urge to make a channel for everything. Empty channels make a server feel dead. Five busy channels beat twenty quiet ones, every time." },
      { type: "h2", id: "roles", text: "Roles: three tiers, then game roles" },
      { type: "p", text: "You need exactly three permission tiers to start: Admin (you and maybe one other person), Mod (can delete messages, mute, kick), and Member (everyone else). Anything fancier than that is procrastination." },
      { type: "p", text: "Separately, add ping-able game roles — @Valorant, @Minecraft — with no permissions at all. They exist purely so people can ping \"anyone up for a game?\" without notifying the whole server. Let members self-assign them through Discord's onboarding or a roles channel." },
      { type: "h2", id: "lfg", text: "Make LFG actually work" },
      { type: "p", text: "The #lfg channel dies in most servers because pinging @everyone gets old fast. The fix is the game roles above: ping @Valorant, get the five people who care, nobody else gets annoyed. Pair it with voice channels that match your party sizes — a channel called \"5-Stack\" with a 5-user limit fills up in a way \"Voice 3\" never does." },
      { type: "h2", id: "fast-way", text: "The fast way: describe it, deploy it" },
      { type: "p", text: "Everything above — categories, channels, roles, permissions — is exactly what the GuildLabs builder generates from a sentence. Type \"a Valorant and Minecraft community with LFG, clips, and ranked voice channels\" and you get the full blueprint to review, edit, and deploy to your server in one click." },
      { type: "steps", items: [
        "Open the builder and describe your server (or pick the Gaming template).",
        "Review the blueprint — drag to reorder, rename anything, tweak the roles.",
        "Sign in with Discord, pick your server, hit Deploy.",
        "Construct creates everything in seconds. Existing channels are never touched.",
      ] },
      { type: "callout", text: "Deploying is additive-only: Construct creates what's missing and skips anything with a matching name. It never deletes or overwrites." },
      { type: "h2", id: "bots", text: "Bots worth adding (and the ones to skip)" },
      { type: "list", items: [
        "A moderation/setup bot — Construct handles verification gates, anti-raid, tickets, and XP leveling for free.",
        "An FAQ answerer if your server has recurring questions (\"what's the modpack?\") — that's what Maven does.",
        "Skip: anything that charges for welcome images, leveling, or basic moderation. Those features have been free for years.",
      ] },
    ],
    relatedLinks: [
      { label: "Build a gaming server with AI", href: "/#builder" },
      { label: "Browse free server templates", href: "/templates" },
      { label: "Construct — the deploy bot", href: "/bots/construct" },
    ],
  },
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
  {
    slug: "discord-server-setup-checklist",
    title: "The Discord server setup checklist",
    description:
      "Everything to do before you invite your first member — a practical, ordered checklist covering structure, roles, safety settings, and bots.",
    date: "2026-06-03",
    author: "GuildLabs",
    tags: ["Setup", "Checklist"],
    readingMinutes: 5,
    body: [
      { type: "p", text: "Most servers get set up in the wrong order: invite friends first, panic about structure later, bolt on moderation after the first incident. Here's the order that avoids all of that — work through it top to bottom and you're launch-ready." },
      { type: "h2", id: "before-anyone-joins", text: "Before anyone joins" },
      { type: "steps", items: [
        "Decide the one-sentence purpose of the server. If you can't write it, members can't either.",
        "Create the structure: 3–5 categories, 8–12 channels. Start smaller than feels right.",
        "Create three roles — Admin, Mod, Member — and set channel permissions per category, not per channel.",
        "Write #rules. Five clear rules beat twenty legalistic ones.",
        "Set the server icon and banner. A server with no icon reads as abandoned.",
      ] },
      { type: "h2", id: "safety", text: "Safety settings (5 minutes, do not skip)" },
      { type: "list", items: [
        "Server Settings → Safety Setup → set Verification Level to at least Medium.",
        "Enable the AutoMod presets for spam and mention raids — they're built into Discord and free.",
        "Turn off @everyone for the Member role (Server Settings → Roles → Member → uncheck Mention @everyone).",
        "Set #rules and #announcements to read-only for members.",
        "If the server will be public, add a verification gate so new joins click a button before they can post.",
      ] },
      { type: "h2", id: "bots", text: "Add bots — but only ones that earn their slot" },
      { type: "p", text: "Every bot is a thing members have to learn and a permission you have to trust. Add the minimum: something for setup and moderation, and one bot per real need (charts for a finance server, an FAQ bot for a support server). Construct covers verification panels, anti-raid, tickets, and leveling in one free bot." },
      { type: "h2", id: "skip-the-list", text: "Or skip the list entirely" },
      { type: "p", text: "The structure, roles, and permissions on this checklist are exactly what the GuildLabs builder generates. Describe your server in a sentence — or pick a template — review the blueprint, and deploy it. The checklist above becomes a two-minute job." },
      { type: "callout", text: "Launch rule: don't open the doors until there's something to read. Seed #chat with a few real conversations first — nobody posts second in an empty room." },
    ],
    relatedLinks: [
      { label: "Generate your server structure", href: "/#builder" },
      { label: "Start from a template", href: "/templates" },
      { label: "Roles and permissions explained", href: "/guides/discord-roles-and-permissions-explained" },
    ],
  },
  {
    slug: "best-free-discord-bots-2026",
    title: "The best free Discord bots in 2026",
    description:
      "A no-fluff list of genuinely free Discord bots in 2026 — what each one does, what it costs (nothing), and how to tell a free bot from a free trial.",
    date: "2026-05-30",
    author: "GuildLabs",
    tags: ["Bots", "Community"],
    readingMinutes: 6,
    body: [
      { type: "p", text: "\"Free Discord bot\" has quietly come to mean \"free trial with a permanent upsell.\" Welcome images: premium. More than three reaction roles: premium. This list is for bots that are actually free — and how to spot the difference before you invite something." },
      { type: "h2", id: "free-vs-freemium", text: "How to tell free from freemium" },
      { type: "list", items: [
        "Read the bot's pricing page before the invite page. If features are split into tiers, assume the ones you want are in the paid tier.",
        "Open-source is the strongest signal — if the code is public and self-hostable, the features can't be taken hostage later.",
        "Check what happens at scale: some bots are free until your server grows, then lock features behind member-count walls.",
      ] },
      { type: "h2", id: "setup-moderation", text: "Server setup & moderation: Construct" },
      { type: "p", text: "Construct deploys an entire server structure from a blueprint — categories, channels, roles, permissions — and then runs the unglamorous essentials: a verification gate, anti-raid protection, a ticket system, welcome messages, and XP leveling with /rank and /leaderboard. All of it free, all of it open-source. The features other bots paywall are the baseline here." },
      { type: "h2", id: "faq", text: "Repeated questions: Maven" },
      { type: "p", text: "Maven watches the channels you tell it to and recognizes when a question has been asked and answered before, then links the asker to the original answer. It runs on a local model, which is why it can be free — there's no per-message API bill to pass on to you. Self-hosted, so your community's messages stay on your machine." },
      { type: "h2", id: "charts", text: "Stocks & crypto: ChartIt" },
      { type: "p", text: "ChartIt posts candlestick charts, live quotes, market heatmaps, multi-ticker comparisons, and price alerts — channel-wide or personal DM — with zero API keys. For finance and trading servers it replaces the \"someone screenshots TradingView\" workflow entirely." },
      { type: "h2", id: "discord-builtin", text: "Don't forget: Discord itself" },
      { type: "p", text: "Before adding a bot for something, check if Discord ships it natively now. AutoMod handles spam and slur filtering. Onboarding handles self-assign roles. Soundboard, polls, and scheduled events are all built in. The best bot is sometimes no bot." },
      { type: "callout", text: "Every GuildLabs bot is MIT-licensed with the source on GitHub. If a feature ever moved behind a paywall, you could self-host the whole thing — which is exactly why none of them will." },
    ],
    relatedLinks: [
      { label: "Browse all GuildLabs bots", href: "/bots" },
      { label: "Construct command reference", href: "/docs/construct" },
      { label: "Add ChartIt to your server", href: "/guides/how-to-add-a-stock-chart-bot-to-discord" },
    ],
  },
  {
    slug: "discord-roles-and-permissions-explained",
    title: "Discord roles and permissions, explained properly",
    description:
      "How Discord roles, permissions, and channel overwrites actually work — the mental model that makes them simple, and the five mistakes everyone makes.",
    date: "2026-05-19",
    author: "GuildLabs",
    tags: ["Permissions", "Setup"],
    readingMinutes: 8,
    body: [
      { type: "p", text: "Discord permissions feel complicated because most people learn them by clicking checkboxes until the problem goes away. The system is actually simple — three layers, evaluated in order. Once you see the layers, every \"why can't this person see this channel?\" mystery becomes solvable in seconds." },
      { type: "h2", id: "three-layers", text: "The three layers" },
      { type: "steps", items: [
        "Server permissions: each role grants permissions server-wide. A member's base permissions are the union of all their roles.",
        "Category overwrites: a category can override those defaults for everything inside it — allow, deny, or inherit (the gray slash).",
        "Channel overwrites: an individual channel can override its category. This is the layer that causes 90% of confusion.",
      ] },
      { type: "p", text: "Evaluation order for any member in any channel: start with their roles' server permissions, apply the category's overwrites, then the channel's. Deny beats allow at the same layer, but a more specific layer beats a more general one — a channel-level allow overrides a category-level deny." },
      { type: "callout", text: "One giant exception: Administrator bypasses everything. No overwrite can hide a channel from an admin. If you're testing member visibility while wearing an admin role, you'll see everything and learn nothing — use a test account or Discord's \"View Server as Role\" tool." },
      { type: "h2", id: "the-pattern", text: "The pattern that keeps you sane" },
      { type: "list", items: [
        "Set permissions on categories, and let channels inherit (keep them synced). Per-channel overwrites are the exception, not the rule.",
        "Keep the @everyone role nearly empty for public servers and grant via a Member role instead — it gives you one switch for \"what can unverified people do.\"",
        "Three permission tiers (Admin, Mod, Member) cover almost every server. Decorative and ping roles get zero permissions.",
        "Role hierarchy matters separately from permissions: a mod can only moderate people below their highest role, and bots can only assign roles below their own.",
      ] },
      { type: "h2", id: "common-mistakes", text: "The five classic mistakes" },
      { type: "list", items: [
        "Giving every fun role a sprinkle of permissions — then spending an hour figuring out which of nine roles lets someone pin messages.",
        "Unsynced channels nobody remembers unsyncing. If a channel behaves weirdly, check Sync Now first.",
        "Granting Administrator to a bot that only needs to send messages. Read the permission list on every invite.",
        "Denying View Channel to @everyone on a category, then wondering why mods can't see it either (their allow needs to be explicit).",
        "Building a verification gate out of manual overwrites on every channel instead of one Member role granted on verify.",
      ] },
      { type: "h2", id: "presets", text: "Or use presets and skip the spaghetti" },
      { type: "p", text: "The GuildLabs builder sidesteps all of this: roles in a blueprint use clear presets — admin, mod, trusted, member, view — that map to realistic Discord permission sets. You describe the server, review which role can do what in plain language, and Construct wires the actual overwrites correctly on deploy." },
    ],
    relatedLinks: [
      { label: "Build a server with sane permissions", href: "/#builder" },
      { label: "The server setup checklist", href: "/guides/discord-server-setup-checklist" },
      { label: "Construct — deploy & manage", href: "/bots/construct" },
    ],
  },
  {
    slug: "how-to-build-a-community-discord-server",
    title: "How to build a community Discord server from scratch",
    description:
      "A practical guide to starting a community Discord that people actually return to — structure, the first ten members, moderation, and the habits that keep it alive.",
    date: "2026-05-06",
    author: "GuildLabs",
    tags: ["Community", "Setup"],
    readingMinutes: 7,
    body: [
      { type: "p", text: "Anyone can create a Discord server in thirty seconds. Building one people open every day is a different job — part structure, part hosting, part patience. This guide covers the parts that actually move the needle, in the order they matter." },
      { type: "h2", id: "purpose", text: "Start narrower than feels comfortable" },
      { type: "p", text: "\"A server for developers\" competes with a thousand servers. \"A server for people building Discord bots in JavaScript\" has a reason to exist. Narrow communities grow because every member is relevant to every other member — you can always widen later, once the core is alive." },
      { type: "h2", id: "structure", text: "Structure for the size you are, not the size you want" },
      { type: "list", items: [
        "Under 50 members: one general channel, one topic channel, one voice lounge. That's it. Fragmenting ten active people across twelve channels kills momentum.",
        "50–500: split by activity — #help, #showcase, #off-topic — and add a read-only #announcements you actually use.",
        "500+: now categories, regional channels, and forum channels earn their place. Add them when existing channels overflow, not before.",
      ] },
      { type: "h2", id: "first-ten", text: "The first ten members matter more than the next hundred" },
      { type: "p", text: "Invite people individually, tell them why you thought of them, and have three conversations already visible when they arrive. The early tone becomes the culture — whatever the first ten members do, the next hundred will copy. An empty server with a great structure still feels dead; a three-channel server with two good conversations feels alive." },
      { type: "h2", id: "moderation", text: "Moderation: boring on purpose" },
      { type: "steps", items: [
        "Write five rules in plain language. Pin them. Enforce them the first time, kindly.",
        "Turn on Discord's AutoMod for spam and mention raids before you need it.",
        "Add a verification gate once strangers start joining — one button between joining and posting filters most drive-by spam.",
        "Recruit your first mod from your most consistently helpful member, not your most online one.",
        "Set up a ticket system so disputes happen in private channels, not in #general.",
      ] },
      { type: "p", text: "Construct handles the last three for free — /config verification, /config tickets, and an anti-raid threshold — so the safety net is one command each, not an evening of overwrites." },
      { type: "h2", id: "rituals", text: "Rituals beat features" },
      { type: "p", text: "Communities stay alive on rhythm: a weekly show-and-tell thread, a monthly voice hangout, a Friday question. Pick one ritual you can sustain forever and do it every week without fail. One reliable ritual outperforms five abandoned ones — and gives lurkers a recurring, low-stakes reason to post." },
      { type: "callout", text: "Ready to start? Describe your community in a sentence in the builder and get the full structure — channels, roles, permissions — to review and deploy in minutes." },
    ],
    relatedLinks: [
      { label: "Describe your server, get a blueprint", href: "/#builder" },
      { label: "Community server templates", href: "/templates" },
      { label: "Stop answering the same questions", href: "/guides/how-to-stop-answering-the-same-questions-in-discord" },
    ],
  },
  {
    slug: "how-to-make-a-study-discord-server",
    title: "How to make a study Discord server",
    description:
      "Set up a study or homework-help Discord for your class, exam cohort, or study group — focus rooms, subject channels, helper roles, and the bots that help.",
    date: "2026-04-22",
    author: "GuildLabs",
    tags: ["Setup", "Study"],
    readingMinutes: 5,
    body: [
      { type: "p", text: "Study servers are one of Discord's best use cases: a class group chat that doesn't bury the important stuff, plus virtual study rooms that make solo work feel less solo. Here's a setup that works for a class of 30 or an exam community of 3,000." },
      { type: "h2", id: "channels", text: "The channel layout" },
      { type: "list", items: [
        "INFO — #announcements (deadlines, exam dates — read-only) and #resources (pinned notes, past papers, links).",
        "SUBJECTS — one channel per subject or module. Forum channels work brilliantly here: each question becomes its own thread, so answers don't get buried.",
        "STUDY — #study-log for accountability posts and #help for general questions that don't fit a subject.",
        "VOICE — two or three Focus Rooms (cameras optional, mics muted by convention) and one Talk room for actual discussion.",
      ] },
      { type: "callout", text: "The silent-but-together focus room is the feature people stay for. Name them clearly — \"Focus 1 (muted)\" vs \"Study Talk\" — so nobody has to guess the etiquette." },
      { type: "h2", id: "roles", text: "Roles that help instead of decorate" },
      { type: "list", items: [
        "Helper — for members who consistently answer questions. Pingable, and a visible thank-you that costs nothing.",
        "Subject roles — @Calculus, @Organic-Chem — so questions can ping the people who actually take that course.",
        "Mod — at least one person besides you who can clean up spam during exam season, when servers get busiest.",
      ] },
      { type: "h2", id: "repeat-questions", text: "Solve the repeated-question problem" },
      { type: "p", text: "Every study server converges on the same questions: \"when is the midterm?\", \"which textbook edition?\", \"is the lab graded?\". Maven was built for exactly this — it indexes past questions and answers in the channels you choose, and when someone asks a repeat, it quietly links them to the original answer. Your helpers stop being human FAQ machines." },
      { type: "h2", id: "deploy", text: "Set it up in two minutes" },
      { type: "p", text: "Describe your server in the GuildLabs builder — \"a study server for a biology cohort with subject channels, focus voice rooms, and helper roles\" — review the generated blueprint, and deploy it with Construct. The structure above, without an afternoon of channel creation." },
    ],
    relatedLinks: [
      { label: "Build your study server", href: "/#builder" },
      { label: "Maven — the FAQ memory bot", href: "/bots/maven" },
      { label: "Browse server templates", href: "/templates" },
    ],
  },
  {
    slug: "how-to-make-a-discord-server-for-creators",
    title: "How to make a Discord server for your YouTube or Twitch community",
    description:
      "Turn viewers into a community — the creator server structure that works, sub-only perks without the paywall energy, and go-live notifications done right.",
    date: "2026-04-09",
    author: "GuildLabs",
    tags: ["Creators", "Community", "Setup"],
    readingMinutes: 6,
    body: [
      { type: "p", text: "A creator Discord is where your audience becomes a community — the difference between people who watch you and people who know each other. But creator servers also fail in a specific way: they're built as a shrine to the creator, and shrines are quiet. Here's the structure that gives viewers reasons to talk to each other." },
      { type: "h2", id: "structure", text: "The layout" },
      { type: "list", items: [
        "INFO — #welcome, #rules, and #announcements wired to your uploads and go-lives. Read-only.",
        "COMMUNITY — #general, #memes, #clips-and-highlights. This is the actual server; everything else is furniture.",
        "YOUR CONTENT — #video-discussion (a thread per upload keeps it tidy) and #suggestions for the endless \"you should make a video about…\" energy.",
        "VOICE — a hangout lounge and a stream-watch channel for co-watching premieres and going live together.",
      ] },
      { type: "h2", id: "roles", text: "Roles: viewers, supporters, regulars" },
      { type: "p", text: "Connect YouTube or Twitch in Server Settings → Connections and Discord will sync your members and subs to a role automatically. Give supporters a color, early access to a channel, or first crack at community games — visible perks that don't wall off the actual community. Add an earned \"Regular\" role for active non-subscribers; the people who show up daily are worth more than a one-month sub." },
      { type: "callout", text: "Don't lock #general behind a sub. The free community is the funnel — paywall the bonus room, never the front door." },
      { type: "h2", id: "notifications", text: "Go-live pings people don't mute" },
      { type: "steps", items: [
        "Make a @Stream Ping role with zero permissions, self-assignable through onboarding.",
        "Ping that role — never @everyone — when you go live or upload.",
        "Keep #announcements signal-only. The moment it becomes a second feed, people mute it and you've lost your reach.",
      ] },
      { type: "h2", id: "moderation", text: "Moderation that scales past raid night" },
      { type: "p", text: "Creator servers get hit hardest right after a video pops. Before that happens: a verification gate so new joins click a button before posting, anti-raid thresholds for join floods, and a ticket system so DM drama becomes a private channel instead of a #general meltdown. Construct ships all three free — /config verification, /config antiraid, /config tickets — plus XP leveling, which quietly rewards the regulars who make your chat feel alive." },
      { type: "h2", id: "fast", text: "Skip to the good part" },
      { type: "p", text: "Describe it — \"a Discord for my gaming YouTube channel with clips, video discussion, sub perks, and stream-watch voice\" — and the GuildLabs builder generates the whole blueprint to review and deploy. Spend the saved hour making the video instead." },
    ],
    relatedLinks: [
      { label: "Build your creator server", href: "/#builder" },
      { label: "Creator server templates", href: "/templates" },
      { label: "Construct command reference", href: "/docs/construct" },
    ],
  },
  {
    slug: "how-to-stop-answering-the-same-questions-in-discord",
    title: "How to stop answering the same questions in Discord",
    description:
      "Pinned FAQs don't work because nobody reads them. Here's how to actually kill repeat questions in your Discord — culture, channel design, and a bot with a memory.",
    date: "2026-03-26",
    author: "GuildLabs",
    tags: ["Maven", "Community"],
    readingMinutes: 5,
    body: [
      { type: "p", text: "Every active server develops the same disease: the same five questions, asked forever. You pin an FAQ. Nobody reads it. You make a #faq channel. Nobody reads that either. The helpers who used to enjoy answering questions slowly burn out on answering the same one. Here's what actually works." },
      { type: "h2", id: "why-pins-fail", text: "Why pins and FAQ channels fail" },
      { type: "p", text: "Asking in chat is easier than searching, and Discord's search doesn't understand meaning — someone searching \"how do I get the role\" won't find an answer phrased as \"roles are assigned in #get-roles.\" The asker isn't lazy; the tools genuinely make asking again the path of least resistance. Any fix that depends on members changing their behavior will lose." },
      { type: "h2", id: "reduce", text: "First, reduce the question surface" },
      { type: "list", items: [
        "Use forum channels for help — one thread per question keeps answers findable and lets you mark them solved.",
        "Answer in public, every time. A great answer delivered in DMs helps one person; in a channel, it helps everyone who searches later.",
        "Rename channels to answer questions preemptively: #downloads-and-setup beats #links.",
        "Put the top three answers in the channel topic — it's visible at the top of the screen, unlike pins.",
      ] },
      { type: "h2", id: "maven", text: "Then give the server a memory" },
      { type: "p", text: "Maven is a bot that does the part humans can't sustain: it indexes the questions and answers in the channels you choose, and when someone asks something semantically similar — not word-for-word, similar in meaning — it replies with a link to the original answer. The asker gets helped instantly; your regulars don't have to type the same paragraph for the fortieth time." },
      { type: "steps", items: [
        "Add Maven and run /maven watch on your help channels.",
        "Run /maven import to index a channel's existing history — up to 5,000 messages of past answers, instantly searchable.",
        "Tune /maven sensitivity (default 78%) — higher is stricter about what counts as a repeat.",
        "Pick a reply mode with /maven reply: public, quiet (auto-deletes after 60s), or index-only.",
      ] },
      { type: "callout", text: "Maven runs on a local model — your community's messages are indexed on your own machine, not shipped to a paid API. That's why it's free, and why it stays that way." },
      { type: "h2", id: "culture", text: "Keep the culture kind" },
      { type: "p", text: "The goal is never to make people feel bad for asking — \"just read the FAQ\" culture kills servers faster than repeat questions do. A bot that politely surfaces the past answer keeps the tone friendly: the question gets answered, the asker learns the history exists, and nobody had to sigh in public." },
    ],
    relatedLinks: [
      { label: "Maven — past wisdom, recovered", href: "/bots/maven" },
      { label: "Maven command reference", href: "/docs/maven" },
      { label: "Build a community server from scratch", href: "/guides/how-to-build-a-community-discord-server" },
    ],
  },
];

export function getGuide(slug: string): GuidePost | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
