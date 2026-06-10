export type FeatureRow = {
  feature: string;
  guildlabs: string | boolean;
  competitor: string | boolean;
};

export type ComparisonPage = {
  slug: string;
  /** The GuildLabs product this page compares. Defaults to "GuildLabs". */
  productName?: string;
  competitorName: string;
  competitorTagline: string;
  category: "server-builder" | "bot" | "template-tool" | "chart-tool";
  intro: string;
  guildlabsStrengths: string[];
  competitorStrengths: string[];
  featureMatrix: FeatureRow[];
  useWhenGuildLabs: string[];
  useWhenCompetitor: string[];
  verdict: string;
  faqs: { q: string; a: string }[];
};

export const COMPARISONS: ComparisonPage[] = [
  {
    slug: "mee6",
    competitorName: "MEE6",
    competitorTagline: "The most popular Discord bot",
    category: "bot",
    intro:
      "MEE6 is the most widely-used Discord bot — known for leveling, welcome messages, and basic moderation. GuildLabs is a server builder that sets up your entire server structure in one go. They solve different problems, but there's overlap in the setup phase.",
    guildlabsStrengths: [
      "Sets up your entire server (channels, roles, permissions) in one click",
      "AI-guided setup — no config knowledge required",
      "Open source and fully free — no premium tier",
      "Works with any bot after setup, including MEE6",
    ],
    competitorStrengths: [
      "Industry-leading leveling and XP system",
      "Huge plugin ecosystem (20+ plugins)",
      "Deep moderation features",
      "Massive community and documentation",
    ],
    featureMatrix: [
      { feature: "Automated channel creation", guildlabs: true, competitor: false },
      { feature: "Role hierarchy setup", guildlabs: true, competitor: false },
      { feature: "AI-guided configuration", guildlabs: true, competitor: false },
      { feature: "XP / leveling system", guildlabs: false, competitor: true },
      { feature: "Welcome messages", guildlabs: false, competitor: true },
      { feature: "Auto-moderation", guildlabs: false, competitor: true },
      { feature: "100% free", guildlabs: true, competitor: false },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Server templates", guildlabs: true, competitor: false },
      { feature: "Music playback", guildlabs: false, competitor: true },
    ],
    useWhenGuildLabs: [
      "You're starting a new Discord server and want it set up correctly from day one",
      "You want channels, roles, and permissions configured without manual work",
      "You want a free, open-source solution with no premium upsell",
    ],
    useWhenCompetitor: [
      "Your server is already set up and you need leveling, XP, and engagement features",
      "You need deep auto-moderation with custom triggers",
      "You want a music bot and social commands",
    ],
    verdict:
      "GuildLabs and MEE6 complement each other perfectly. Use GuildLabs to build your server structure, then add MEE6 for ongoing engagement, leveling, and moderation. You don't have to choose.",
    faqs: [
      { q: "Is GuildLabs better than MEE6?", a: "They do different things. GuildLabs sets up your server structure (channels, roles, permissions). MEE6 runs ongoing features like leveling and moderation. Most servers benefit from using both." },
      { q: "Can I use GuildLabs and MEE6 together?", a: "Yes — and this is the recommended approach. Build your server with GuildLabs, then add MEE6 for leveling, welcome messages, and moderation." },
      { q: "Is MEE6 free?", a: "MEE6 has a free tier but many features (custom welcome images, advanced moderation, dashboard) require MEE6 Premium at $11.95/month. GuildLabs is completely free and open source." },
    ],
  },
  {
    slug: "carl-bot",
    competitorName: "Carl-bot",
    competitorTagline: "The most customisable Discord bot",
    category: "bot",
    intro:
      "Carl-bot is renowned for its reaction roles, logging, and deep customisation. GuildLabs builds your server structure from scratch using an AI-guided wizard. They operate at different stages of the server lifecycle.",
    guildlabsStrengths: [
      "Full server scaffolding — channels, roles, and permissions in one step",
      "AI suggests smart defaults based on your server type",
      "Zero configuration required — works out of the box",
      "Free with no premium tier",
    ],
    competitorStrengths: [
      "Best-in-class reaction roles (up to 250 per message)",
      "Extremely detailed logging system",
      "Custom commands and autoresponders",
      "Highly trusted with 99.9%+ uptime",
    ],
    featureMatrix: [
      { feature: "Server structure setup", guildlabs: true, competitor: false },
      { feature: "AI-guided configuration", guildlabs: true, competitor: false },
      { feature: "Reaction roles", guildlabs: false, competitor: true },
      { feature: "Detailed audit logging", guildlabs: false, competitor: true },
      { feature: "Custom commands", guildlabs: false, competitor: true },
      { feature: "Server templates", guildlabs: true, competitor: false },
      { feature: "100% free", guildlabs: true, competitor: true },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Auto-moderation", guildlabs: false, competitor: true },
    ],
    useWhenGuildLabs: [
      "You're creating a Discord server and want it structured correctly from the start",
      "You want an opinionated, best-practice server layout without manual setup",
      "You're building multiple servers and want a repeatable process",
    ],
    useWhenCompetitor: [
      "You need reaction roles for your existing server",
      "You need comprehensive audit logging",
      "You want custom commands and autoresponders",
    ],
    verdict:
      "Use GuildLabs to build, use Carl-bot to run. GuildLabs handles the one-time setup; Carl-bot handles the ongoing management. They work excellently together.",
    faqs: [
      { q: "Is Carl-bot completely free?", a: "Carl-bot's core features are free. Carl-bot Premium ($5/month) unlocks higher reaction role limits and premium features. GuildLabs is 100% free with no premium tier." },
      { q: "GuildLabs vs Carl-bot — which should I choose?", a: "Use both. GuildLabs to scaffold your server structure, Carl-bot to manage reaction roles, logging, and custom commands once it's running." },
      { q: "Can Carl-bot create channels and roles automatically?", a: "No — Carl-bot manages existing server elements but doesn't create your server structure. That's where GuildLabs comes in." },
    ],
  },
  {
    slug: "dyno",
    competitorName: "Dyno",
    competitorTagline: "The fully customisable moderation bot",
    category: "bot",
    intro:
      "Dyno is a veteran Discord bot focused on moderation, custom commands, and server management. GuildLabs is a server builder. Different tools, different jobs.",
    guildlabsStrengths: [
      "Builds your entire server from a blueprint",
      "AI-guided — no Discord expertise needed",
      "Free and open source",
      "Exports reusable server blueprints",
    ],
    competitorStrengths: [
      "Battle-tested moderation system",
      "Extensive custom commands",
      "Auto-moderation and spam protection",
      "Reliable uptime with millions of servers",
    ],
    featureMatrix: [
      { feature: "Automated server setup", guildlabs: true, competitor: false },
      { feature: "Blueprint export", guildlabs: true, competitor: false },
      { feature: "Advanced moderation", guildlabs: false, competitor: true },
      { feature: "Custom commands", guildlabs: false, competitor: true },
      { feature: "Anti-spam", guildlabs: false, competitor: true },
      { feature: "100% free", guildlabs: true, competitor: false },
      { feature: "Open source", guildlabs: true, competitor: false },
    ],
    useWhenGuildLabs: [
      "Starting a new server and need structure fast",
      "Want a reusable server blueprint for multiple communities",
    ],
    useWhenCompetitor: [
      "You need heavy-duty moderation on an existing server",
      "You rely on custom commands and autoresponders",
    ],
    verdict:
      "GuildLabs gets your server built. Dyno keeps it safe. Use both for a complete setup.",
    faqs: [
      { q: "Is Dyno free?", a: "Dyno has a free tier. Dyno Premium ($6.99+/month) removes ads and unlocks advanced features. GuildLabs is completely free." },
      { q: "Does Dyno create server structures?", a: "No — Dyno manages servers but doesn't create them. Use GuildLabs to build your server, then add Dyno for moderation." },
    ],
  },
  {
    slug: "discord-templates",
    competitorName: "Discord Templates",
    competitorTagline: "Discord's built-in template system",
    category: "template-tool",
    intro:
      "Discord's native template system lets you clone a server's structure. GuildLabs goes further — it uses AI to guide your choices and build a custom blueprint. Here's how they compare.",
    guildlabsStrengths: [
      "AI-guided setup tailored to your specific community type",
      "Customise channels, roles, and permissions through a guided wizard",
      "Richer template library with community-specific defaults",
      "Exports a full JSON blueprint you can reuse and version",
      "Free and open source",
    ],
    competitorStrengths: [
      "Built directly into Discord — no third-party tool needed",
      "One-click clone of any server structure",
      "No setup required",
      "Trusted by Discord itself",
    ],
    featureMatrix: [
      { feature: "AI-guided customisation", guildlabs: true, competitor: false },
      { feature: "Community-specific templates", guildlabs: true, competitor: "Limited" },
      { feature: "Blueprint export (JSON)", guildlabs: true, competitor: false },
      { feature: "No third-party required", guildlabs: false, competitor: true },
      { feature: "One-click clone", guildlabs: false, competitor: true },
      { feature: "Customisation wizard", guildlabs: true, competitor: false },
      { feature: "Bot recommendations", guildlabs: true, competitor: false },
      { feature: "Free", guildlabs: true, competitor: true },
    ],
    useWhenGuildLabs: [
      "You want a custom server tailored to your community type",
      "You want AI to suggest channels, roles, and bots",
      "You're building multiple servers with a consistent structure",
    ],
    useWhenCompetitor: [
      "You want to clone an existing server's structure quickly",
      "You don't want to use a third-party tool",
      "You need the simplest possible setup",
    ],
    verdict:
      "Discord Templates are great for quick clones. GuildLabs is better when you want a server thoughtfully designed for your specific community — not just a copy of someone else's.",
    faqs: [
      { q: "Is GuildLabs better than Discord's template system?", a: "For simple cloning, Discord Templates win on convenience. For building a server tailored to your community with AI guidance, GuildLabs gives you more control and better results." },
      { q: "Can I export my GuildLabs blueprint and re-use it?", a: "Yes — GuildLabs exports a JSON blueprint you can save, share, and deploy to multiple servers." },
    ],
  },
  {
    slug: "pory",
    competitorName: "Pory",
    competitorTagline: "Discord membership communities",
    category: "server-builder",
    intro:
      "Pory helps creators build paid membership communities on Discord. GuildLabs helps anyone build a well-structured Discord server for free. Different audiences, different goals.",
    guildlabsStrengths: [
      "Completely free — no paid memberships or fees",
      "AI-guided setup for any community type",
      "Open source and self-hostable",
      "Works for any type of Discord server",
    ],
    competitorStrengths: [
      "Built-in payment processing for paid communities",
      "Member management dashboard",
      "Course and content delivery",
      "Designed specifically for creator monetisation",
    ],
    featureMatrix: [
      { feature: "Free to use", guildlabs: true, competitor: false },
      { feature: "AI server builder", guildlabs: true, competitor: false },
      { feature: "Paid memberships", guildlabs: false, competitor: true },
      { feature: "Payment processing", guildlabs: false, competitor: true },
      { feature: "Member management", guildlabs: false, competitor: true },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Any community type", guildlabs: true, competitor: false },
    ],
    useWhenGuildLabs: [
      "Building a free community of any type",
      "You want AI to help design your server structure",
      "You don't need payment processing",
    ],
    useWhenCompetitor: [
      "You're a creator monetising a paid Discord community",
      "You need payment processing and member management",
    ],
    verdict:
      "Pory is for paid creator communities. GuildLabs is for everyone building a Discord server — free, open, and AI-assisted.",
    faqs: [
      { q: "Is Pory free?", a: "Pory takes a percentage of membership revenue. GuildLabs is 100% free." },
      { q: "Can GuildLabs help me build a paid Discord?", a: "GuildLabs sets up the server structure. For paid memberships, you'd pair it with a tool like Pory or Whop for payment processing." },
    ],
  },
  {
    slug: "combot",
    competitorName: "Combot",
    competitorTagline: "Analytics and moderation for Discord",
    category: "bot",
    intro:
      "Combot is a Discord bot focused on analytics, anti-spam, and community management. GuildLabs builds server structures. They serve different phases of community building.",
    guildlabsStrengths: [
      "Builds your entire server structure from scratch",
      "AI-assisted — no config expertise needed",
      "Free and open source",
    ],
    competitorStrengths: [
      "Detailed server analytics dashboard",
      "Anti-spam and raid protection",
      "Member activity tracking",
      "Custom triggers and filters",
    ],
    featureMatrix: [
      { feature: "Server structure setup", guildlabs: true, competitor: false },
      { feature: "Analytics dashboard", guildlabs: false, competitor: true },
      { feature: "Anti-spam", guildlabs: false, competitor: true },
      { feature: "Member activity tracking", guildlabs: false, competitor: true },
      { feature: "Free", guildlabs: true, competitor: true },
      { feature: "Open source", guildlabs: true, competitor: false },
    ],
    useWhenGuildLabs: [
      "Starting a new server or rebuilding an existing one",
      "Need a well-structured server fast",
    ],
    useWhenCompetitor: [
      "You want detailed analytics on your existing server",
      "You need anti-spam and raid protection",
    ],
    verdict:
      "Build with GuildLabs. Analyse with Combot. Both are free and work well together.",
    faqs: [
      { q: "Is Combot free?", a: "Combot has a free tier. Advanced analytics and features require Combot Pro. GuildLabs is fully free." },
      { q: "Does Combot set up server channels?", a: "No — Combot monitors and manages servers but doesn't create structure. Use GuildLabs to build, Combot to track." },
    ],
  },
  {
    slug: "chartit-vs-tradingview",
    productName: "ChartIt",
    competitorName: "TradingView",
    competitorTagline: "Web-based charting and analysis platform",
    category: "chart-tool",
    intro:
      "TradingView is a powerful web and mobile platform for charting and technical analysis. ChartIt is a free Discord bot that brings live charts, quotes, and price alerts directly into your server. They're complementary: deep analysis on TradingView, fast charts and alerts where your community already hangs out.",
    guildlabsStrengths: [
      "Posts live candlestick charts directly in Discord — no leaving the app",
      "Free with no account required — just add it to your server",
      "Per-user and channel price alerts that ping or DM you",
      "Market heatmaps, multi-ticker comparisons, and headlines as slash commands",
    ],
    competitorStrengths: [
      "Industry-leading charting and technical-analysis suite",
      "Huge library of indicators and drawing tools",
      "Pine Script for custom indicators and strategies",
      "Deep historical data and screeners",
    ],
    featureMatrix: [
      { feature: "Works inside Discord", guildlabs: true, competitor: false },
      { feature: "Candlestick charts", guildlabs: true, competitor: true },
      { feature: "Price alerts", guildlabs: true, competitor: true },
      { feature: "No account required", guildlabs: true, competitor: false },
      { feature: "Share a chart in chat instantly", guildlabs: true, competitor: "Link only" },
      { feature: "Deep technical-analysis suite", guildlabs: "Web chart", competitor: true },
      { feature: "Custom scripting (e.g. Pine Script)", guildlabs: false, competitor: true },
      { feature: "Free tier", guildlabs: true, competitor: true },
    ],
    useWhenGuildLabs: [
      "Your trading or investing chat lives on Discord",
      "You want charts, quotes, and alerts without anyone leaving the server",
      "You want something free that works in seconds with no setup",
    ],
    useWhenCompetitor: [
      "You need a full technical-analysis workspace with advanced indicators",
      "You write custom indicators or strategies",
      "You want screeners and deep historical data",
    ],
    verdict:
      "Use TradingView for serious, hands-on analysis — and ChartIt to bring those charts, quotes, and price alerts into your Discord community where the conversation happens. Most trading servers benefit from both.",
    faqs: [
      { q: "Is ChartIt a TradingView alternative?", a: "For posting charts and alerts inside Discord, yes. For deep, hands-on technical analysis on the web, TradingView is the more powerful tool. Many people use both." },
      { q: "Does ChartIt cost anything?", a: "No — ChartIt is free and needs no API key or account. Just add it to your Discord server." },
      { q: "Can ChartIt send price alerts like TradingView?", a: "Yes. ChartIt can ping a channel or DM you personally when a ticker crosses a price you set." },
    ],
  },
];

export function getComparison(slug: string): ComparisonPage | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
