/**
 * Tutorial content for the docs. Pure data (no JSX) so it's safe to import on the
 * server for static generation and metadata. Icons are referenced by key and
 * resolved in the client (see _icons.tsx).
 */

export type TutorialLevel = "Beginner" | "Intermediate" | "Advanced";
export type TutorialCategory = "Construct" | "ChartIt" | "Maven" | "Account";

export type TutorialStep = {
  title: string;
  body: string;
  code?: string;
};

export type Tutorial = {
  slug: string;
  title: string;
  summary: string;
  category: TutorialCategory;
  level: TutorialLevel;
  minutes: number;
  /** icon key resolved in _icons.tsx */
  icon: string;
  steps: TutorialStep[];
  related?: string[];
};

export const TUTORIAL_CATEGORIES: TutorialCategory[] = ["Construct", "ChartIt", "Maven", "Account"];
export const TUTORIAL_LEVELS: TutorialLevel[] = ["Beginner", "Intermediate", "Advanced"];

export const TUTORIALS: Tutorial[] = [
  {
    slug: "build-your-first-server",
    title: "Build your first server with AI",
    summary: "Describe what you want and let Construct design a complete, deployable Discord server.",
    category: "Construct",
    level: "Beginner",
    minutes: 4,
    icon: "wand",
    steps: [
      { title: "Open the builder", body: "Go to the homepage and scroll to the builder, or press ⌘K and choose “Build a server with AI”.", code: "https://www.guildlabs.fun/#builder" },
      { title: "Describe your server", body: "In the “Describe it ✨” box, write who it’s for, the vibe, and the channels and roles you imagine. One or two sentences is plenty.", code: "A cozy book club for sci-fi readers — monthly reads, spoiler-safe channels, a voice room, and roles for current vs. finished books." },
      { title: "Answer a couple of questions", body: "The AI asks up to three quick clarifying questions (size, vibe, moderation). Tap a suggested chip or type your own answer." },
      { title: "Review, edit, deploy", body: "You get a full blueprint to review. Tweak anything, accept the terms, then deploy it straight to your server." },
    ],
    related: ["edit-a-blueprint", "deploy-to-discord", "use-the-wizard"],
  },
  {
    slug: "use-the-wizard",
    title: "Use the step-by-step wizard",
    summary: "Prefer clicking to typing? Build a blueprint by choosing options step by step.",
    category: "Construct",
    level: "Beginner",
    minutes: 3,
    icon: "list",
    steps: [
      { title: "Switch to “Step by step”", body: "At the top of the builder, toggle from “Describe it” to the step-by-step mode." },
      { title: "Pick a type and name", body: "Choose one or more server types (gaming, community, crypto…) and give your server a name." },
      { title: "Choose features & channels", body: "Set the moderation level, turn on features like voice or events, and pick which channel groups to include." },
      { title: "Roles & preview", body: "Add role packs or custom roles, then open the preview to see the finished blueprint and deploy." },
    ],
    related: ["build-your-first-server", "design-role-hierarchy"],
  },
  {
    slug: "edit-a-blueprint",
    title: "Edit a blueprint: reorder & move channels",
    summary: "Fine-tune the generated structure with drag-and-drop before anything is deployed.",
    category: "Construct",
    level: "Beginner",
    minutes: 3,
    icon: "drag",
    steps: [
      { title: "Open the editor", body: "After generating, the result view includes a draggable editor for categories, channels, and roles." },
      { title: "Reorder", body: "Grab a grip handle (⋮⋮) and drag to reorder categories, channels within a category, or roles." },
      { title: "Move channels between categories", body: "Drag a channel out of one category and drop it into another — the structure updates live." },
      { title: "Rename & change type", body: "Click any name to rename it, and use the type dropdown to switch a channel between text, voice, stage, or forum." },
    ],
    related: ["design-role-hierarchy", "export-reuse-blueprint"],
  },
  {
    slug: "design-role-hierarchy",
    title: "Design a clean role hierarchy",
    summary: "Set up roles, permission presets, colors, and hoisting that won’t leak access.",
    category: "Construct",
    level: "Intermediate",
    minutes: 4,
    icon: "shield",
    steps: [
      { title: "Add roles top-to-bottom", body: "In the editor’s Roles section, add roles in order of authority — staff above members." },
      { title: "Pick permission presets", body: "Each role uses a clear preset: admin, mod, trusted, member, or view. These map to realistic Discord permissions." },
      { title: "Color & hoist", body: "Give each role a color, and toggle “hoist” to display it as its own group in the member list." },
      { title: "Keep one admin", body: "Make sure exactly one role has the administrator preset — that’s your owner/admin role." },
    ],
    related: ["edit-a-blueprint", "deploy-to-discord"],
  },
  {
    slug: "deploy-to-discord",
    title: "Deploy a blueprint to your server",
    summary: "Turn a blueprint into real categories, channels, and roles in seconds.",
    category: "Construct",
    level: "Beginner",
    minutes: 3,
    icon: "rocket",
    steps: [
      { title: "Accept the terms", body: "Before deploying, agree to the terms gate (it’s a one-time, in-browser confirmation)." },
      { title: "Click Deploy", body: "Hit “Deploy to Discord” to open the deploy dialog." },
      { title: "Sign in & pick a server", body: "Authenticate with Discord and choose a server you manage. The bot needs Administrator to create roles and channels." },
      { title: "Watch it build", body: "Construct creates everything in seconds. Items with a matching name are skipped — nothing is ever deleted." },
    ],
    related: ["build-your-first-server", "sign-in-dashboard"],
  },
  {
    slug: "crypto-community",
    title: "Set up a crypto community",
    summary: "A finance-ready server with market channels, disclaimers, and holder roles.",
    category: "Construct",
    level: "Intermediate",
    minutes: 5,
    icon: "coins",
    steps: [
      { title: "Describe a finance server", body: "Mention market chat, price alerts, voice AMAs, and the size of your community.", code: "A crypto trading community (~2k members) with market analysis, price alerts, weekly voice AMAs, and verified holder roles." },
      { title: "Keep the disclaimers", body: "The AI adds a disclaimers channel and a “not financial advice” note. Keep both." },
      { title: "Add holder roles", body: "Use the “trusted” preset for verified/holder roles so they unlock gated channels." },
      { title: "Bring in live charts", body: "Invite ChartIt so members can pull charts in #market-chat without leaving Discord." },
    ],
    related: ["post-your-first-chart", "design-role-hierarchy"],
  },
  {
    slug: "gaming-guild",
    title: "Set up a gaming guild",
    summary: "LFG, clips, squad voice rooms, and per-game roles — designed in one go.",
    category: "Construct",
    level: "Intermediate",
    minutes: 4,
    icon: "gamepad",
    steps: [
      { title: "Describe the guild", body: "Mention LFG and clips channels, squad voice rooms, game-night events, and your main games.", code: "An indie game guild of ~500 players — LFG, clips, squad voice rooms, game-night events, and roles per game." },
      { title: "Per-game roles", body: "Ask for roles per game so members can self-identify and you can ping the right squad." },
      { title: "Voice rooms", body: "Confirm squad voice channels are present; add more in the editor if you run big nights." },
      { title: "Deploy", body: "Review and deploy — then drop your invite in the clips channel." },
    ],
    related: ["build-your-first-server", "edit-a-blueprint"],
  },
  {
    slug: "export-reuse-blueprint",
    title: "Export & reuse a blueprint (JSON)",
    summary: "Copy the deployable JSON to version it, share it, or redeploy later.",
    category: "Construct",
    level: "Intermediate",
    minutes: 3,
    icon: "braces",
    steps: [
      { title: "Open the JSON tab", body: "In the wizard preview, switch to the JSON tab to see the full deployable blueprint." },
      { title: "Copy it", body: "Use the copy button — you’ll get a toast confirming it’s on your clipboard." },
      { title: "Store or share", body: "Commit it to a repo, paste it in a gist, or hand it to a teammate to redeploy the exact same structure." },
    ],
    related: ["edit-a-blueprint", "deploy-to-discord"],
  },
  {
    slug: "post-your-first-chart",
    title: "Post your first chart",
    summary: "Get a candlestick chart, live quote, and headlines for any ticker.",
    category: "ChartIt",
    level: "Beginner",
    minutes: 2,
    icon: "chart",
    steps: [
      { title: "Invite ChartIt", body: "Add ChartIt to your server from its product page — no API keys needed." },
      { title: "Run /chart", body: "Use the chart command with any stock or crypto ticker.", code: "/chart symbol:AAPL" },
      { title: "Pick a range", body: "Add a range to zoom in or out across time.", code: "/chart symbol:BTC-USD range:1y" },
    ],
    related: ["compare-tickers", "quotes-and-news"],
  },
  {
    slug: "compare-tickers",
    title: "Compare multiple tickers",
    summary: "Overlay several assets on one chart, normalized to percent change.",
    category: "ChartIt",
    level: "Beginner",
    minutes: 2,
    icon: "compare",
    steps: [
      { title: "Run /compare", body: "Pass 2–5 tickers separated by commas.", code: "/compare symbols:AAPL,MSFT,NVDA" },
      { title: "Read it", body: "Each line is normalized to its percent change, so differently-priced assets are directly comparable." },
    ],
    related: ["post-your-first-chart", "market-heatmap"],
  },
  {
    slug: "price-alerts",
    title: "Set up price alerts",
    summary: "Get pinged when a ticker crosses a threshold you set.",
    category: "ChartIt",
    level: "Intermediate",
    minutes: 3,
    icon: "bell",
    steps: [
      { title: "Add an alert", body: "Create an alert with a ticker and a target price.", code: "/alert add symbol:BTC-USD price:75000" },
      { title: "Manage alerts", body: "List your active alerts and remove ones you no longer need." },
    ],
    related: ["post-your-first-chart", "quotes-and-news"],
  },
  {
    slug: "market-heatmap",
    title: "Read the market heatmap",
    summary: "See the whole market at a glance — green/red, sized by significance.",
    category: "ChartIt",
    level: "Beginner",
    minutes: 2,
    icon: "grid",
    steps: [
      { title: "Run /heatmap", body: "Post a market heatmap right in the channel.", code: "/heatmap" },
      { title: "Read it", body: "Tiles are colored by gain/loss and sized by significance, so the movers stand out instantly." },
    ],
    related: ["post-your-first-chart", "compare-tickers"],
  },
  {
    slug: "quotes-and-news",
    title: "Quick quotes & news",
    summary: "Fast, text-only quotes and the latest headlines for any ticker.",
    category: "ChartIt",
    level: "Beginner",
    minutes: 2,
    icon: "quote",
    steps: [
      { title: "Run /quote", body: "Get a fast, text-only price without rendering a full chart.", code: "/quote symbol:TSLA" },
      { title: "Headlines", body: "Every /chart also includes the latest headlines for that ticker underneath the quote." },
    ],
    related: ["post-your-first-chart", "price-alerts"],
  },
  {
    slug: "self-host-maven",
    title: "Self-host Maven",
    summary: "Run the community Q&A bot on your own machine — data stays local.",
    category: "Maven",
    level: "Advanced",
    minutes: 6,
    icon: "server",
    steps: [
      { title: "Clone the repo", body: "Grab the source from GitHub.", code: "git clone https://github.com/LUCAPOPESCU29/GuildLabs" },
      { title: "Install dependencies", body: "Install everything Maven needs.", code: "cd GuildLabs && npm install" },
      { title: "Configure tokens", body: "Copy the example env and add your Discord bot token.", code: "cp .env.example .env.local" },
      { title: "Run it", body: "Start Maven. Embeddings and replies are stored locally — nothing is sent to external AI APIs.", code: "npm run dev" },
    ],
    related: ["sign-in-dashboard"],
  },
  {
    slug: "sign-in-dashboard",
    title: "Sign in & use the dashboard",
    summary: "Authenticate with Discord and manage the servers you’ve built.",
    category: "Account",
    level: "Beginner",
    minutes: 3,
    icon: "key",
    steps: [
      { title: "Sign in with Discord", body: "Use the sign-in button. We only see your profile and the servers you can manage." },
      { title: "Open the dashboard", body: "From the nav, open the dashboard to see and configure your servers." },
      { title: "Configure features", body: "After a deploy, jump straight to the server’s settings to fine-tune features." },
    ],
    related: ["deploy-to-discord", "command-palette"],
  },
  {
    slug: "command-palette",
    title: "Master the ⌘K command palette",
    summary: "Jump anywhere, open any chart, or switch themes from one overlay.",
    category: "Account",
    level: "Beginner",
    minutes: 2,
    icon: "command",
    steps: [
      { title: "Open it", body: "Press ⌘K (or Ctrl+K), or click the Search pill in the nav.", code: "⌘K  /  Ctrl+K" },
      { title: "Jump anywhere", body: "Search pages, type a ticker to open its chart, run actions, or switch light/dark theme." },
      { title: "See all shortcuts", body: "Press ? anywhere to open the keyboard-shortcuts help." },
    ],
    related: ["sign-in-dashboard", "post-your-first-chart"],
  },
];

export function getTutorial(slug: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}

export function relatedTutorials(t: Tutorial): Tutorial[] {
  return (t.related ?? [])
    .map((s) => getTutorial(s))
    .filter((x): x is Tutorial => !!x);
}
