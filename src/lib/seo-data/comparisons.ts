/**
 * Comparison-page data for /vs/[slug].
 *
 * Honesty policy: every claim about a competitor must be accurate and
 * verifiable. Competitor pricing changes, so amounts are phrased as
 * "from around $X/month" and each page carries a lastReviewed date.
 * Never invent statistics or user counts. Factual contrast, no disparagement.
 */

export type FeatureRow = {
  feature: string;
  /** true = yes, false = no, string = nuanced answer (rendered with a "partial" icon + text). */
  guildlabs: string | boolean;
  competitor: string | boolean;
};

export type MigrationStep = { title: string; detail: string };

export type RelatedLink = { label: string; href: string };

export type ComparisonPage = {
  slug: string;
  /** The GuildLabs product this page compares. Defaults to "GuildLabs". */
  productName?: string;
  competitorName: string;
  competitorTagline: string;
  category: "server-builder" | "bot" | "template-tool" | "chart-tool";
  intro: string;
  /** Month + year the competitor facts were last checked, e.g. "June 2026". */
  lastReviewed: string;
  guildlabsStrengths: string[];
  competitorStrengths: string[];
  featureMatrix: FeatureRow[];
  useWhenGuildLabs: string[];
  useWhenCompetitor: string[];
  /** Honest reasons to pick the competitor — trust is the differentiator. */
  chooseThemInstead: string[];
  migration: { heading: string; intro: string; steps: MigrationStep[] };
  verdict: string;
  faqs: { q: string; a: string }[];
  related: RelatedLink[];
};

export const COMPARISONS: ComparisonPage[] = [
  {
    slug: "mee6",
    competitorName: "MEE6",
    competitorTagline: "The most popular Discord bot",
    category: "bot",
    lastReviewed: "June 2026",
    intro:
      "MEE6 is one of the most widely-used Discord bots — known for leveling, welcome messages, and plugin-based moderation, with many features gated behind MEE6 Premium. GuildLabs is a free, open-source suite: Construct builds your entire server structure with AI, Maven answers member questions with a local model, and ChartIt posts live market charts. They solve different problems, but if you're searching for a free MEE6 alternative for server setup, this is the honest breakdown.",
    guildlabsStrengths: [
      "Sets up your entire server — channels, roles, permissions — from a plain-English description",
      "Everything is free: no premium tier, no paywalled plugins, no upsell",
      "Open source — you can read, audit, and self-host the code",
      "Maven answers FAQs with a local model, so member questions never leave your hardware",
      "Exports reusable JSON blueprints so you can rebuild or clone a server in minutes",
    ],
    competitorStrengths: [
      "Mature leveling and XP system with role rewards",
      "Large plugin ecosystem covering welcomes, moderation, polls, and more",
      "Web dashboard that non-technical mods find easy to use",
      "Years of documentation, tutorials, and community answers",
    ],
    featureMatrix: [
      { feature: "Free tier", guildlabs: true, competitor: true },
      { feature: "Everything free (no premium tier)", guildlabs: true, competitor: false },
      { feature: "Typical paid cost", guildlabs: "Free — no paid plan exists", competitor: "Premium from around $11.95/mo" },
      { feature: "Paywalled features", guildlabs: "None", competitor: "Custom welcome cards, higher limits, premium plugins" },
      { feature: "AI server builder", guildlabs: true, competitor: false },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Local / private AI answers", guildlabs: "Yes — Maven runs a local model", competitor: false },
      { feature: "Stock & crypto charts", guildlabs: "Yes — ChartIt", competitor: false },
      { feature: "XP / leveling system", guildlabs: false, competitor: true },
      { feature: "Welcome messages", guildlabs: false, competitor: true },
      { feature: "Auto-moderation", guildlabs: false, competitor: true },
      { feature: "Server blueprint export", guildlabs: true, competitor: false },
      { feature: "Setup time", guildlabs: "Minutes — describe it, review, deploy", competitor: "Quick to add; plugins configured one by one" },
    ],
    useWhenGuildLabs: [
      "You're starting a new Discord server and want it structured correctly from day one",
      "You want channels, roles, and permissions configured without manual work",
      "You want a free, open-source stack with zero premium upsell",
      "Your community asks the same questions repeatedly and you want a private FAQ bot",
    ],
    useWhenCompetitor: [
      "Your server is already set up and you need leveling, XP, and engagement features",
      "You want a polished web dashboard your mod team can use",
      "You rely on MEE6 plugins your community already knows",
    ],
    chooseThemInstead: [
      "You need leveling, XP, and role rewards — GuildLabs deliberately doesn't do engagement gamification, and MEE6's system is one of the most mature around.",
      "Your moderation team is non-technical and wants a point-and-click dashboard for everything.",
      "Your community is already trained on MEE6 commands and rank cards — switching costs are real, and familiarity has value.",
      "You're willing to pay for Premium and want one bot to cover many engagement plugins at once.",
    ],
    migration: {
      heading: "Switching your setup workflow from MEE6 to GuildLabs",
      intro:
        "GuildLabs doesn't replace MEE6's leveling — it replaces the hours of manual setup around it. Here's how most servers make the move (and you can keep MEE6 running the whole time).",
      steps: [
        {
          title: "Describe your server in the playground",
          detail:
            "Open the GuildLabs playground and describe your community in plain English — Construct's AI drafts channels, categories, roles, and permissions for you.",
        },
        {
          title: "Review and edit the blueprint",
          detail:
            "Everything is shown before anything is created. Rename channels, drop roles you don't need, and adjust permissions until it matches your vision.",
        },
        {
          title: "Deploy to your server",
          detail:
            "Invite the Construct bot and deploy the blueprint. Your structure appears in one pass — no clicking through Discord's settings for an afternoon.",
        },
        {
          title: "Decide what MEE6 still does for you",
          detail:
            "If you use MEE6 for leveling or welcomes, keep it — GuildLabs doesn't conflict with it. If you only used MEE6 for setup-adjacent tasks, you can remove it from Server Settings → Integrations.",
        },
        {
          title: "Add Maven or ChartIt if they fit",
          detail:
            "Maven handles repeated member questions with a local, private model; ChartIt adds live charts and price alerts for finance communities. Both are free.",
        },
      ],
    },
    verdict:
      "GuildLabs and MEE6 mostly complement each other. Use GuildLabs to build your server structure for free, then add MEE6 if you genuinely need leveling and engagement plugins — just go in knowing which MEE6 features sit behind Premium.",
    faqs: [
      {
        q: "Is MEE6 free?",
        a: "MEE6 has a free tier, but many features — custom welcome cards, higher limits, and several premium plugins — require MEE6 Premium, which starts at around $11.95/month (pricing can change; check mee6.xyz). GuildLabs is completely free and open source, with no premium tier.",
      },
      {
        q: "What is the best free MEE6 alternative?",
        a: "It depends on which MEE6 feature you're replacing. For server setup, GuildLabs Construct builds your channels, roles, and permissions free with AI. For leveling specifically, look at free leveling bots — GuildLabs intentionally doesn't do XP systems.",
      },
      {
        q: "Is GuildLabs better than MEE6?",
        a: "They do different jobs. GuildLabs sets up your server structure and adds free FAQ and chart bots; MEE6 runs ongoing engagement features like leveling and welcomes. For setup, GuildLabs is stronger; for gamification, MEE6 is.",
      },
      {
        q: "Can I use GuildLabs and MEE6 together?",
        a: "Yes — and it's a common combination. Build your server with GuildLabs, then add MEE6 for leveling and welcome messages. Neither bot interferes with the other.",
      },
      {
        q: "Does GuildLabs have a leveling system like MEE6?",
        a: "No. GuildLabs focuses on server setup (Construct), local-AI FAQ answers (Maven), and market charts (ChartIt). If leveling matters to your community, run a dedicated leveling bot alongside GuildLabs.",
      },
      {
        q: "Is MEE6 open source?",
        a: "No, MEE6 is closed source and run as a commercial product. GuildLabs is open source — you can inspect the code or self-host the bots.",
      },
    ],
    related: [
      { label: "Browse free server templates", href: "/templates" },
      { label: "Construct — the AI server builder", href: "/bots/construct" },
      { label: "Maven — private, local-AI FAQ bot", href: "/bots/maven" },
      { label: "Try the playground", href: "/playground" },
    ],
  },
  {
    slug: "carl-bot",
    competitorName: "Carl-bot",
    competitorTagline: "The most customisable Discord bot",
    category: "bot",
    lastReviewed: "June 2026",
    intro:
      "Carl-bot is renowned for reaction roles, logging, and deep customisation, with a generous free tier and a paid Premium plan for higher limits. GuildLabs builds your server structure from scratch with an AI wizard and adds free FAQ and chart bots. They operate at different stages of the server lifecycle — here's exactly where each one earns its place.",
    guildlabsStrengths: [
      "Full server scaffolding — channels, roles, and permissions in one deploy",
      "AI suggests smart defaults based on your community type",
      "Free with no premium tier — limits aren't monetised",
      "Open source and auditable",
      "Blueprint export lets you version and reuse your server design",
    ],
    competitorStrengths: [
      "Best-in-class reaction roles with a generous free allowance",
      "Extremely detailed logging system",
      "Custom commands, tags, and autoresponders",
      "Long track record and a large knowledge base of guides",
    ],
    featureMatrix: [
      { feature: "Free tier", guildlabs: true, competitor: true },
      { feature: "Everything free (no premium tier)", guildlabs: true, competitor: false },
      { feature: "Typical paid cost", guildlabs: "Free — no paid plan exists", competitor: "Premium from around $7.99/mo per server" },
      { feature: "Paywalled features", guildlabs: "None", competitor: "Higher reaction-role limits, custom bot branding, premium perks" },
      { feature: "AI server builder", guildlabs: true, competitor: false },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Local / private AI answers", guildlabs: "Yes — Maven runs a local model", competitor: false },
      { feature: "Stock & crypto charts", guildlabs: "Yes — ChartIt", competitor: false },
      { feature: "Reaction roles", guildlabs: false, competitor: true },
      { feature: "Detailed audit logging", guildlabs: false, competitor: true },
      { feature: "Custom commands / tags", guildlabs: false, competitor: true },
      { feature: "Creates channels, roles & permissions", guildlabs: true, competitor: false },
      { feature: "Setup time", guildlabs: "Minutes — describe it, review, deploy", competitor: "Quick to add; features configured via dashboard" },
    ],
    useWhenGuildLabs: [
      "You're creating a Discord server and want it structured correctly from the start",
      "You want an opinionated, best-practice layout without manual setup",
      "You're building multiple servers and want a repeatable, exportable process",
    ],
    useWhenCompetitor: [
      "You need reaction roles on an existing server",
      "You need comprehensive audit logging",
      "You want custom commands and autoresponders",
    ],
    chooseThemInstead: [
      "Reaction roles are your main need — Carl-bot's implementation is excellent and the free tier covers most servers.",
      "You want forensic-grade logging of edits, deletes, joins, and role changes; GuildLabs doesn't do logging at all.",
      "Your mods live in custom commands and tags — that's Carl-bot's home turf.",
      "Your server is already built and running well; a setup tool adds little at that point.",
    ],
    migration: {
      heading: "Adding GuildLabs to a Carl-bot server (or starting fresh)",
      intro:
        "Most people don't migrate away from Carl-bot — they add GuildLabs in front of it. Here's the typical flow whether you're rebuilding or starting a new community.",
      steps: [
        {
          title: "Blueprint your structure with Construct",
          detail:
            "Describe your community in the GuildLabs playground. The AI drafts categories, channels, and a sane role hierarchy you can edit before anything touches Discord.",
        },
        {
          title: "Deploy the blueprint",
          detail:
            "Invite Construct and deploy. If you're rebuilding an existing server, deploy to a fresh server first so you can compare layouts side by side.",
        },
        {
          title: "Re-add Carl-bot and rebuild reaction roles",
          detail:
            "Reaction roles reference specific role and channel IDs, so set them up again on the new structure via Carl-bot's dashboard — it's the one step that can't be automated.",
        },
        {
          title: "Point logging at your new channels",
          detail:
            "Recreate Carl-bot's log channel assignments so moderation history starts flowing into the right places from day one.",
        },
        {
          title: "Export your blueprint",
          detail:
            "Save the GuildLabs JSON blueprint. Next time you launch a community, you start from your proven layout instead of a blank server.",
        },
      ],
    },
    verdict:
      "Use GuildLabs to build, use Carl-bot to run. GuildLabs handles the one-time setup; Carl-bot handles reaction roles, logging, and commands once the server is live. They work well together, and both have genuinely useful free tiers.",
    faqs: [
      {
        q: "Is Carl-bot completely free?",
        a: "Carl-bot's core features — including a generous reaction-role allowance — are free. Carl-bot Premium, starting at around $7.99/month for one server (check carl.gg for current pricing), unlocks higher limits and extra perks. GuildLabs has no paid tier at all.",
      },
      {
        q: "What is a good free alternative to Carl-bot?",
        a: "For reaction roles and logging, Carl-bot's own free tier is hard to beat. If what you actually need is server setup — channels, roles, permissions — GuildLabs Construct does that free with AI guidance, which Carl-bot doesn't do.",
      },
      {
        q: "GuildLabs vs Carl-bot — which should I choose?",
        a: "Use both. GuildLabs scaffolds your server structure with AI; Carl-bot manages reaction roles, logging, and custom commands once it's running. They don't overlap or conflict.",
      },
      {
        q: "Can Carl-bot create channels and roles automatically?",
        a: "No — Carl-bot manages existing server elements but doesn't generate your server structure. That's GuildLabs Construct's job: it creates channels, categories, roles, and permissions from a description.",
      },
      {
        q: "Is Carl-bot open source?",
        a: "No, Carl-bot is closed source. GuildLabs is open source, so you can audit exactly what the bots do with your server.",
      },
    ],
    related: [
      { label: "Browse free server templates", href: "/templates" },
      { label: "Construct — the AI server builder", href: "/bots/construct" },
      { label: "Try the playground", href: "/playground" },
    ],
  },
  {
    slug: "dyno",
    competitorName: "Dyno",
    competitorTagline: "The fully customisable moderation bot",
    category: "bot",
    lastReviewed: "June 2026",
    intro:
      "Dyno is a veteran Discord bot focused on moderation, custom commands, and server management, with a free tier and per-server Premium plans. GuildLabs is a free, open-source server builder with companion FAQ and chart bots. Different tools, different jobs — here's the honest line between them.",
    guildlabsStrengths: [
      "Builds your entire server from an AI-generated blueprint",
      "No Discord expertise needed — describe your community in plain English",
      "Free and open source, with nothing behind a paywall",
      "Exports reusable server blueprints for repeat launches",
      "Maven and ChartIt add free FAQ answers and market charts",
    ],
    competitorStrengths: [
      "Battle-tested moderation toolkit refined over many years",
      "Extensive custom commands and module system",
      "Auto-moderation and anti-spam protection",
      "Web dashboard for configuring everything per server",
    ],
    featureMatrix: [
      { feature: "Free tier", guildlabs: true, competitor: true },
      { feature: "Everything free (no premium tier)", guildlabs: true, competitor: false },
      { feature: "Typical paid cost", guildlabs: "Free — no paid plan exists", competitor: "Premium from around $4.99/mo per server" },
      { feature: "Paywalled features", guildlabs: "None", competitor: "Premium unlocks extra modules, limits, and perks" },
      { feature: "AI server builder", guildlabs: true, competitor: false },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Local / private AI answers", guildlabs: "Yes — Maven runs a local model", competitor: false },
      { feature: "Stock & crypto charts", guildlabs: "Yes — ChartIt", competitor: false },
      { feature: "Advanced moderation", guildlabs: false, competitor: true },
      { feature: "Custom commands", guildlabs: false, competitor: true },
      { feature: "Anti-spam", guildlabs: false, competitor: true },
      { feature: "Blueprint export", guildlabs: true, competitor: false },
      { feature: "Setup time", guildlabs: "Minutes — describe it, review, deploy", competitor: "Quick to add; modules toggled in the dashboard" },
    ],
    useWhenGuildLabs: [
      "You're starting a new server and need structure fast",
      "You want a reusable server blueprint for multiple communities",
      "You want every feature free and the code open to inspection",
    ],
    useWhenCompetitor: [
      "You need heavy-duty moderation on an existing server",
      "You rely on custom commands and autoresponders",
      "You want anti-spam and raid protection running 24/7",
    ],
    chooseThemInstead: [
      "Moderation is your top priority — Dyno's automod, anti-spam, and mod-action tooling are proven at scale, and GuildLabs doesn't moderate at all.",
      "You want one long-established bot your mod team already knows how to drive.",
      "You need a per-server dashboard for tweaking modules without touching commands.",
      "Your server is mature and stable; you don't need setup tooling, you need upkeep tooling.",
    ],
    migration: {
      heading: "Pairing GuildLabs with Dyno on a new server",
      intro:
        "GuildLabs builds the house; Dyno guards it. If you're launching (or relaunching) a server, this is the order that saves the most time.",
      steps: [
        {
          title: "Generate your structure with Construct",
          detail:
            "Describe the community in the GuildLabs playground and let the AI draft channels, categories, roles, and permissions. Edit anything before deploying.",
        },
        {
          title: "Deploy and verify permissions",
          detail:
            "Deploy the blueprint, then spot-check that role permissions match your intent — especially mod and admin roles, which Dyno will rely on.",
        },
        {
          title: "Invite Dyno and enable moderation modules",
          detail:
            "Turn on automod, anti-spam, and logging in Dyno's dashboard, pointing logs at the mod channels Construct created.",
        },
        {
          title: "Add Maven for repeated questions",
          detail:
            "If members ask the same questions, Maven answers them automatically with a local model — keeping your mod team focused on actual moderation.",
        },
        {
          title: "Save the blueprint",
          detail:
            "Export your GuildLabs blueprint so your next launch starts from a layout you've already proven works with Dyno.",
        },
      ],
    },
    verdict:
      "GuildLabs gets your server built; Dyno keeps it safe. There's almost no feature overlap, so this isn't really an either/or — it's a question of which phase of server life you're in.",
    faqs: [
      {
        q: "Is Dyno free?",
        a: "Dyno has a solid free tier covering core moderation and commands. Dyno Premium, starting at around $4.99/month per server (multi-server bundles cost more; check dyno.gg for current pricing), unlocks additional features. GuildLabs is entirely free.",
      },
      {
        q: "Does Dyno create server structures?",
        a: "No — Dyno manages and moderates existing servers but doesn't create channels, roles, or permissions for you. GuildLabs Construct builds the structure; Dyno runs on top of it.",
      },
      {
        q: "What is the best free alternative to Dyno?",
        a: "For moderation itself, Dyno's free tier is already strong, and Discord's built-in AutoMod covers basics. If your real goal is setting up a server quickly, GuildLabs does that free — it's a different category of tool.",
      },
      {
        q: "Can I use GuildLabs and Dyno together?",
        a: "Yes. Build your server with GuildLabs, then add Dyno for moderation and anti-spam. They operate on different layers and don't conflict.",
      },
      {
        q: "Is Dyno open source?",
        a: "No, Dyno is closed source. GuildLabs is open source — the code for all three bots is public and auditable.",
      },
    ],
    related: [
      { label: "Browse free server templates", href: "/templates" },
      { label: "Construct — the AI server builder", href: "/bots/construct" },
      { label: "Maven — private, local-AI FAQ bot", href: "/bots/maven" },
    ],
  },
  {
    slug: "discord-templates",
    competitorName: "Discord Templates",
    competitorTagline: "Discord's built-in template system",
    category: "template-tool",
    lastReviewed: "June 2026",
    intro:
      "Discord's native template system lets you clone a server's channel and role structure with one click — free and built right into the app. GuildLabs goes further: an AI wizard tailors a blueprint to your specific community, recommends bots, and exports JSON you can version and reuse. Here's an honest look at when the built-in tool is enough and when it isn't.",
    guildlabsStrengths: [
      "AI-guided setup tailored to your specific community type",
      "Customise channels, roles, and permissions through a guided wizard before anything is created",
      "Community-specific template library — gaming, crypto, study groups, startups, and more",
      "Exports a full JSON blueprint you can edit, version, and redeploy",
      "Recommends bots (FAQ, charts, moderation) that fit your server type",
    ],
    competitorStrengths: [
      "Built directly into Discord — no third-party tool or bot invite needed",
      "One-click clone of a server's channels, roles, and settings",
      "Zero learning curve",
      "First-party feature maintained by Discord itself",
    ],
    featureMatrix: [
      { feature: "Price", guildlabs: "Free", competitor: "Free" },
      { feature: "AI-guided customisation", guildlabs: true, competitor: false },
      { feature: "Community-specific templates", guildlabs: true, competitor: "Limited selection" },
      { feature: "Edit the layout before creating it", guildlabs: true, competitor: false },
      { feature: "Blueprint export (JSON)", guildlabs: true, competitor: false },
      { feature: "Bot recommendations", guildlabs: true, competitor: false },
      { feature: "No third-party tool required", guildlabs: false, competitor: true },
      { feature: "One-click clone of an existing server", guildlabs: false, competitor: true },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Setup time", guildlabs: "Minutes — describe, review, deploy", competitor: "Seconds for a straight clone" },
    ],
    useWhenGuildLabs: [
      "You want a server tailored to your community type, not a copy of someone else's",
      "You want AI to suggest channels, roles, and bots you'd otherwise miss",
      "You're building multiple servers and want a consistent, versionable structure",
    ],
    useWhenCompetitor: [
      "You want to clone an existing server's structure as fast as possible",
      "You don't want to use any third-party tool",
      "The server you're copying is already exactly what you need",
    ],
    chooseThemInstead: [
      "You already have a server whose layout you love — a native template clones it in seconds, and nothing beats that for speed.",
      "You're cautious about third-party tools and want to stay entirely within Discord's first-party features.",
      "Your needs are simple — a handful of channels and a couple of roles don't require an AI wizard.",
    ],
    migration: {
      heading: "Moving from a Discord template to a GuildLabs blueprint",
      intro:
        "Started from a native template and outgrown it? Here's how to graduate to a structure designed for your community rather than copied from someone else's.",
      steps: [
        {
          title: "Note what the template got wrong",
          detail:
            "List the channels nobody uses, the missing ones members keep asking for, and the role gaps. This becomes your prompt.",
        },
        {
          title: "Describe your real community in the playground",
          detail:
            "Tell Construct what your server is actually for — including the fixes from step one. The AI drafts a blueprint built around your community, not the template author's.",
        },
        {
          title: "Review, edit, deploy",
          detail:
            "Adjust the draft, then deploy to a fresh server (or carefully to your existing one). You see every change before it happens.",
        },
        {
          title: "Export and keep the blueprint",
          detail:
            "Unlike a native template, your GuildLabs blueprint is a JSON file you own — edit it, version it, and redeploy it whenever you launch something new.",
        },
      ],
    },
    verdict:
      "Discord Templates win on raw speed and zero friction for straight clones. GuildLabs is better when you want a server thoughtfully designed for your specific community — with editable, exportable blueprints instead of a one-shot copy.",
    faqs: [
      {
        q: "Are Discord server templates free?",
        a: "Yes — templates are a free, built-in Discord feature. GuildLabs is also free; the difference is in customisation, AI guidance, and blueprint export, not price.",
      },
      {
        q: "Is GuildLabs better than Discord's template system?",
        a: "For cloning an existing layout instantly, Discord Templates win on convenience. For building a server tailored to your community — with AI suggestions and an editable blueprint — GuildLabs gives you more control and a reusable result.",
      },
      {
        q: "What don't Discord templates copy?",
        a: "Native templates copy channels, roles, and core settings — but not messages, members, bots, or bot configurations. After cloning, you still set up bots manually; GuildLabs recommends bots as part of its flow.",
      },
      {
        q: "Can I export my GuildLabs blueprint and reuse it?",
        a: "Yes — GuildLabs exports a JSON blueprint you can save, edit, share, and deploy to as many servers as you like.",
      },
      {
        q: "Can I see the server layout before it's created?",
        a: "With GuildLabs, yes — you review and edit the full blueprint before deploying. A native template applies its structure immediately when you create the server.",
      },
    ],
    related: [
      { label: "Browse free server templates", href: "/templates" },
      { label: "Gaming server template", href: "/templates/gaming-server" },
      { label: "Try the playground", href: "/playground" },
    ],
  },
  {
    slug: "pory",
    competitorName: "Pory",
    competitorTagline: "No-code app and portal builder",
    category: "server-builder",
    lastReviewed: "June 2026",
    intro:
      "Pory is a no-code builder that turns Airtable data into web apps, portals, and member sites — it doesn't build Discord servers. GuildLabs builds Discord servers and doesn't build websites. If you landed here comparing the two, you're really choosing where your community lives: a web portal, a Discord server, or (often) both. Here's the honest breakdown.",
    guildlabsStrengths: [
      "Builds a complete Discord server — channels, roles, permissions — with AI guidance",
      "Completely free and open source, with no paid plans",
      "Maven adds a private, local-AI FAQ bot for your members",
      "Real-time community out of the box: voice, threads, events via Discord",
    ],
    competitorStrengths: [
      "Turns Airtable bases into polished web apps and portals without code",
      "User accounts, groups, and permission-gated content on the web",
      "Drag-and-drop building blocks and templates for directories, portals, and member sites",
      "A public website is indexable by search engines — Discord content isn't",
    ],
    featureMatrix: [
      { feature: "Builds Discord servers", guildlabs: true, competitor: false },
      { feature: "Builds web apps / portals", guildlabs: false, competitor: true },
      { feature: "Price", guildlabs: "Free — no paid plan exists", competitor: "Paid plans — check pory.io for current pricing" },
      { feature: "AI-guided setup", guildlabs: true, competitor: false },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Airtable as a data backend", guildlabs: false, competitor: true },
      { feature: "Real-time chat & voice", guildlabs: "Via Discord", competitor: false },
      { feature: "Local / private AI answers", guildlabs: "Yes — Maven runs a local model", competitor: false },
      { feature: "Public, search-indexable pages", guildlabs: false, competitor: true },
      { feature: "Setup time", guildlabs: "Minutes — describe, review, deploy", competitor: "Hours, depending on your Airtable base" },
    ],
    useWhenGuildLabs: [
      "Your community's home is real-time chat — Discord is where members hang out",
      "You want a free, structured server without manual setup",
      "You need an FAQ bot and live engagement, not a content site",
    ],
    useWhenCompetitor: [
      "You need a public-facing web app, directory, or member portal",
      "Your content already lives in Airtable",
      "You want search-engine-visible pages, which Discord can't provide",
    ],
    chooseThemInstead: [
      "You need a website, not a chat server — a directory, resource library, or client portal belongs on the web, and that's exactly what Pory builds.",
      "Your data lives in Airtable and you want it rendered as an app without writing code.",
      "Discoverability matters: web pages rank in search; Discord conversations don't.",
      "Your audience won't install or open Discord — a browser link has zero friction.",
    ],
    migration: {
      heading: "Adding a Discord server alongside your Pory site",
      intro:
        "Plenty of communities run both: a web portal for content and a Discord for conversation. Here's how to add the Discord half in an afternoon.",
      steps: [
        {
          title: "Describe your community to Construct",
          detail:
            "In the GuildLabs playground, describe what your community does and what your site covers. The AI drafts a server structure that complements it rather than duplicating it.",
        },
        {
          title: "Deploy your server",
          detail:
            "Review the blueprint, adjust channels and roles, and deploy. You'll have a structured server in minutes, free.",
        },
        {
          title: "Turn your site FAQ into a Maven knowledge base",
          detail:
            "Feed the questions your portal already answers into Maven so members get instant answers in Discord — privately, via a local model.",
        },
        {
          title: "Cross-link both homes",
          detail:
            "Add your Discord invite to your Pory site and pin your site link in your server's welcome channel, so each surface feeds the other.",
        },
      ],
    },
    verdict:
      "This isn't really a head-to-head: Pory builds web apps, GuildLabs builds Discord servers. If your community needs a real-time home, GuildLabs gives you one free. If it needs a public website or portal, Pory is the right category of tool. Many communities benefit from both.",
    faqs: [
      {
        q: "Does Pory build Discord servers?",
        a: "No. Pory is a no-code builder for web apps and portals powered by Airtable. If you want a Discord server set up automatically, that's what GuildLabs does — and it's free.",
      },
      {
        q: "Is Pory free?",
        a: "Pory is a commercial product with paid plans — check pory.io for current pricing. GuildLabs is 100% free and open source.",
      },
      {
        q: "Can I use Pory and GuildLabs together?",
        a: "Yes, and it's a sensible split: Pory (or any site builder) for your public web presence, GuildLabs for your Discord community. Link them to each other.",
      },
      {
        q: "Should my community live on a website or on Discord?",
        a: "Use a website when you need public, searchable content and low-friction access. Use Discord when conversation, voice, and belonging are the point. Active communities usually end up with a lightweight site plus a well-structured Discord.",
      },
      {
        q: "Can GuildLabs help me build a paid Discord community?",
        a: "GuildLabs sets up the server structure free. For charging members, pair it with Discord's native Server Subscriptions or a paid-access tool — GuildLabs doesn't process payments.",
      },
    ],
    related: [
      { label: "Startup community template", href: "/templates/startup-community" },
      { label: "Browse free server templates", href: "/templates" },
      { label: "Maven — private, local-AI FAQ bot", href: "/bots/maven" },
    ],
  },
  {
    slug: "combot",
    competitorName: "Combot",
    competitorTagline: "Community management for Telegram",
    category: "bot",
    lastReviewed: "June 2026",
    intro:
      "Quick fact check first: Combot is a Telegram bot — one of the longest-running moderation, anti-spam, and analytics suites for Telegram groups — and it doesn't run on Discord. If you searched for \"Combot for Discord\", you're likely either moving a community from Telegram to Discord or looking for Combot-style features on Discord. This page covers both, honestly.",
    guildlabsStrengths: [
      "Builds a complete Discord server structure with AI — the part Telegram migrations get stuck on",
      "Free and open source, no paid tiers",
      "Maven answers repeated member questions with a local, private model",
      "Blueprint export makes the new server reproducible",
    ],
    competitorStrengths: [
      "Mature moderation and anti-spam (including CAS) for Telegram groups",
      "Group analytics and member activity tracking on Telegram",
      "Reputation system and auto-replies",
      "Long track record in the Telegram ecosystem",
    ],
    featureMatrix: [
      { feature: "Platform", guildlabs: "Discord", competitor: "Telegram" },
      { feature: "Works on Discord", guildlabs: true, competitor: false },
      { feature: "Price", guildlabs: "Free — no paid plan exists", competitor: "Free for small groups; paid plans for larger ones" },
      { feature: "AI server builder", guildlabs: true, competitor: false },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Local / private AI answers", guildlabs: "Yes — Maven runs a local model", competitor: false },
      { feature: "Anti-spam / moderation", guildlabs: "No — pair with a Discord mod bot", competitor: "Yes, on Telegram" },
      { feature: "Community analytics", guildlabs: false, competitor: "Yes, on Telegram" },
      { feature: "Stock & crypto charts", guildlabs: "Yes — ChartIt", competitor: false },
      { feature: "Setup time", guildlabs: "Minutes — describe, review, deploy", competitor: "Quick to add to a Telegram group" },
    ],
    useWhenGuildLabs: [
      "You're moving a Telegram community to Discord and need the server built fast",
      "You want a structured Discord home with FAQ automation from day one",
      "Your crypto or trading group wants charts and price alerts in-channel",
    ],
    useWhenCompetitor: [
      "Your community is staying on Telegram",
      "You need anti-spam and analytics for a Telegram group",
    ],
    chooseThemInstead: [
      "Your community lives on Telegram and is happy there — Combot is built for that platform and GuildLabs simply doesn't run on it.",
      "You need Telegram-side analytics and anti-spam during a gradual migration; keep Combot running on the old group until the move is done.",
    ],
    migration: {
      heading: "Moving a Telegram community to Discord",
      intro:
        "The hard part of a Telegram-to-Discord move isn't the announcement — it's rebuilding structure, rules, and the answers your admins give daily. Here's the playbook.",
      steps: [
        {
          title: "Build the Discord structure with Construct",
          detail:
            "Describe your Telegram community in the GuildLabs playground — topics, sub-groups, admin layers. The AI maps them to Discord categories, channels, and roles you can edit before deploying.",
        },
        {
          title: "Recreate your rules and FAQ with Maven",
          detail:
            "Port your pinned rules and most-asked questions into Maven so newcomers get instant answers — handled by a local model, not a cloud API.",
        },
        {
          title: "Add a Discord moderation bot",
          detail:
            "Combot's anti-spam role is filled on Discord by Discord's built-in AutoMod plus a moderation bot like Dyno or Carl-bot. Set these up before inviting members.",
        },
        {
          title: "Run both homes during the transition",
          detail:
            "Keep the Telegram group (and Combot) alive while members migrate. Pin the Discord invite, and give early movers a role so the new server feels inhabited.",
        },
        {
          title: "Add ChartIt if you're a trading community",
          detail:
            "Many Combot communities are crypto groups — ChartIt brings live charts, quotes, and price alerts straight into your Discord channels, free.",
        },
      ],
    },
    verdict:
      "Combot is a strong tool — for Telegram. On Discord, the equivalent stack is GuildLabs for structure and FAQs, plus a dedicated moderation bot for anti-spam. If your community is migrating platforms, GuildLabs removes the biggest chunk of manual work.",
    faqs: [
      {
        q: "Does Combot work on Discord?",
        a: "No. Combot is built for Telegram groups and channels — it provides moderation, anti-spam, and analytics there, but has no Discord version.",
      },
      {
        q: "Is Combot free?",
        a: "Combot is free for smaller Telegram groups, with paid plans for larger communities — check combot.org for current limits and pricing. GuildLabs is entirely free.",
      },
      {
        q: "What is the Discord equivalent of Combot?",
        a: "No single Discord bot matches Combot one-to-one. The usual stack: GuildLabs for server setup and FAQ automation, Discord's built-in AutoMod plus a bot like Dyno or Carl-bot for moderation and anti-spam, and an analytics bot if you want activity stats.",
      },
      {
        q: "How do I move my Telegram community to Discord?",
        a: "Build the server structure first (GuildLabs does this in minutes), port your rules and FAQ, set up moderation, then run both platforms in parallel while members migrate. A structured, active-feeling server dramatically improves how many members make the jump.",
      },
      {
        q: "Does GuildLabs do analytics like Combot?",
        a: "No — GuildLabs focuses on server setup (Construct), FAQ answers (Maven), and market charts (ChartIt). For Discord analytics, add a dedicated stats bot alongside it.",
      },
    ],
    related: [
      { label: "Crypto community template", href: "/templates/crypto-community" },
      { label: "ChartIt — free charts in Discord", href: "/bots/chartit" },
      { label: "Best finance bots for trading servers", href: "/guides/best-finance-bots-for-trading-servers" },
    ],
  },
  {
    slug: "chartit-vs-tradingview",
    productName: "ChartIt",
    competitorName: "TradingView",
    competitorTagline: "Web-based charting and analysis platform",
    category: "chart-tool",
    lastReviewed: "June 2026",
    intro:
      "TradingView is the heavyweight of web charting — a full technical-analysis workspace with a free ad-supported plan and paid tiers that unlock more indicators and alerts. ChartIt is a free, open-source Discord bot that posts live charts, quotes, heatmaps, and price alerts directly in your server. They're genuinely complementary: deep analysis on TradingView, instant charts where your community already talks.",
    guildlabsStrengths: [
      "Posts live candlestick charts directly in Discord — nobody leaves the conversation",
      "Free and open source, with no account or API key required",
      "Per-user and per-channel price alerts that ping the channel or DM you",
      "Heatmaps, multi-ticker comparisons, and headlines as slash commands",
      "Set up in seconds — invite the bot and type a command",
    ],
    competitorStrengths: [
      "Industry-leading charting and technical-analysis suite",
      "Huge library of indicators and drawing tools",
      "Pine Script for custom indicators and strategies",
      "Screeners, deep historical data, and a polished mobile app",
    ],
    featureMatrix: [
      { feature: "Works inside Discord", guildlabs: true, competitor: false },
      { feature: "Price", guildlabs: "Free — no paid plan exists", competitor: "Free plan with ads; paid tiers unlock more alerts & indicators" },
      { feature: "Candlestick charts", guildlabs: true, competitor: true },
      { feature: "Price alerts", guildlabs: true, competitor: true },
      { feature: "No account required", guildlabs: true, competitor: false },
      { feature: "Open source", guildlabs: true, competitor: false },
      { feature: "Share a chart in chat instantly", guildlabs: true, competitor: "Link or screenshot only" },
      { feature: "Deep technical-analysis suite", guildlabs: "Basic web chart only", competitor: true },
      { feature: "Custom scripting (e.g. Pine Script)", guildlabs: false, competitor: true },
      { feature: "Screeners & historical data", guildlabs: false, competitor: true },
      { feature: "Market heatmaps", guildlabs: true, competitor: true },
      { feature: "Setup time", guildlabs: "Seconds — invite and type /chart", competitor: "Minutes — create an account and learn the workspace" },
    ],
    useWhenGuildLabs: [
      "Your trading or investing chat lives on Discord",
      "You want charts, quotes, and alerts without anyone leaving the server",
      "You want something free that works in seconds with no accounts",
    ],
    useWhenCompetitor: [
      "You need a full technical-analysis workspace with advanced indicators",
      "You write custom indicators or strategies in Pine Script",
      "You want screeners and deep historical data",
    ],
    chooseThemInstead: [
      "You do serious hands-on technical analysis — drawing tools, indicator stacking, and replay are TradingView's core, and ChartIt doesn't attempt them.",
      "You build custom indicators or backtest strategies; Pine Script has no equivalent in a Discord bot.",
      "You trade solo — if there's no community in the loop, an in-Discord chart bot adds little.",
      "You need screeners and decades of historical data for research.",
    ],
    migration: {
      heading: "Bringing your TradingView workflow into Discord",
      intro:
        "Most trading servers don't replace TradingView — they stop screenshotting it. Here's how to give your community live charts in three minutes.",
      steps: [
        {
          title: "Add ChartIt to your server",
          detail:
            "Invite the bot from the ChartIt page. No account, no API key, nothing to configure.",
        },
        {
          title: "Replace screenshots with slash commands",
          detail:
            "Next time someone posts a ticker, run /chart — a live candlestick chart appears in the channel for everyone, always current instead of frozen in a screenshot.",
        },
        {
          title: "Recreate your key alerts in-channel",
          detail:
            "Set price alerts on the levels your community watches. ChartIt pings the channel — or DMs you — the moment a ticker crosses, so the discussion starts where the alert lands.",
        },
        {
          title: "Keep TradingView for deep analysis",
          detail:
            "When a chart sparks real analysis, jump to TradingView for drawing tools and indicators, then bring the conclusion back to the channel.",
        },
      ],
    },
    verdict:
      "Use TradingView for serious, hands-on analysis — and ChartIt to bring live charts, quotes, and price alerts into the Discord conversation. For trading communities, the combination beats either tool alone, and ChartIt's half costs nothing.",
    faqs: [
      {
        q: "Is ChartIt a TradingView alternative?",
        a: "For posting charts and alerts inside Discord, yes. For deep, hands-on technical analysis on the web, TradingView is the more powerful tool. Most trading servers use both.",
      },
      {
        q: "Is TradingView free?",
        a: "TradingView has a free, ad-supported plan with limits on indicators and alerts; paid tiers raise those limits (pricing varies — check tradingview.com). ChartIt is entirely free with no paid tier.",
      },
      {
        q: "Does ChartIt cost anything?",
        a: "No — ChartIt is free and open source, and needs no API key or account. Just add it to your Discord server.",
      },
      {
        q: "Can ChartIt send price alerts like TradingView?",
        a: "Yes. ChartIt can ping a channel or DM you when a ticker crosses a price you set — so alerts land where your community is already talking.",
      },
      {
        q: "What's the best free stock chart bot for Discord?",
        a: "ChartIt is built exactly for this: free candlestick charts, quotes, heatmaps, and price alerts via slash commands, with no account required. TradingView doesn't offer a Discord bot.",
      },
      {
        q: "Does ChartIt support crypto as well as stocks?",
        a: "Yes — ChartIt charts both stock and crypto tickers, including comparisons and market heatmaps.",
      },
    ],
    related: [
      { label: "ChartIt — free charts in Discord", href: "/bots/chartit" },
      { label: "How to add a stock chart bot to Discord", href: "/guides/how-to-add-a-stock-chart-bot-to-discord" },
      { label: "How to set up price alerts in Discord", href: "/guides/how-to-set-up-price-alerts-in-discord" },
      { label: "Crypto community template", href: "/templates/crypto-community" },
    ],
  },
];

export function getComparison(slug: string): ComparisonPage | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
