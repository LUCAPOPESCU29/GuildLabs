export type BotEntry = {
  name: string;
  description: string;
  free: boolean;
  highlight?: string; // standout feature
  guildlabsBot?: boolean;
};

export type BotCategory = {
  slug: string;
  name: string;
  emoji: string;
  headline: string;
  description: string;
  bots: BotEntry[];
  howToChoose: string[];
  relatedSlugs: string[];
  faqs: { q: string; a: string }[];
};

export const BOT_CATEGORIES: BotCategory[] = [
  {
    slug: "moderation",
    name: "Moderation",
    emoji: "🛡️",
    headline: "Best Discord moderation bots in 2025",
    description:
      "Keep your server safe with the best Discord moderation bots. From auto-ban spam to slow mode and word filters — these bots handle the heavy lifting so your mods don't have to.",
    bots: [
      { name: "Carl-bot", description: "The gold standard for moderation — automod, logging, temp-bans, and mute commands. Trusted by millions of servers.", free: true, highlight: "Best overall" },
      { name: "Dyno", description: "Battle-tested moderation with anti-spam, word filters, and a powerful dashboard. One of the most reliable choices.", free: true, highlight: "Most reliable" },
      { name: "Wick", description: "Specialist anti-raid bot with real-time threat detection. Excellent for larger servers that face frequent raids.", free: true, highlight: "Best anti-raid" },
      { name: "MEE6", description: "Popular choice with built-in automod, strike system, and a user-friendly dashboard.", free: false, highlight: "Easiest to configure" },
      { name: "YAGPDB", description: "Highly customisable with complex rule builders. Steeper learning curve but extremely powerful.", free: true, highlight: "Most customisable" },
    ],
    howToChoose: [
      "For most servers, Carl-bot is the right choice — it's free, reliable, and has everything you need.",
      "If raids are your main concern, add Wick on top of Carl-bot for layered protection.",
      "If you want the easiest dashboard, MEE6 is beginner-friendly but requires Premium for advanced features.",
      "Large servers with complex rules should look at YAGPDB for its conditional rule system.",
    ],
    relatedSlugs: ["logging", "verification", "welcome"],
    faqs: [
      { q: "What is the best free Discord moderation bot?", a: "Carl-bot is the best free moderation bot for most servers. It covers auto-moderation, logging, temp-bans, slow mode, and more — all without a premium subscription." },
      { q: "How do I stop raids on my Discord server?", a: "Enable Discord's built-in verification level (Server Settings → Safety Setup), add Wick bot for real-time raid detection, and require phone verification for suspicious join spikes." },
      { q: "What's the difference between Carl-bot and Dyno?", a: "Both are excellent. Carl-bot is generally considered more powerful and has better reaction roles. Dyno has a slightly simpler dashboard and is preferred by some larger servers for its stability." },
    ],
  },
  {
    slug: "welcome",
    name: "Welcome",
    emoji: "👋",
    headline: "Best Discord welcome bots in 2025",
    description:
      "First impressions matter. These Discord welcome bots greet new members, guide them through rules, and assign starter roles — automatically.",
    bots: [
      { name: "MEE6", description: "The most popular welcome bot — customisable welcome messages, images, and DMs. Works out of the box.", free: false, highlight: "Most popular" },
      { name: "Carl-bot", description: "Powerful welcome and goodbye messages with embed support. Free and highly reliable.", free: true, highlight: "Best free option" },
      { name: "Welcomer", description: "Specialist welcome bot with beautiful image-based welcome cards. Highly visual.", free: true, highlight: "Best welcome images" },
      { name: "YAGPDB", description: "Flexible welcome messages with conditional logic — great for complex onboarding flows.", free: true, highlight: "Most flexible" },
    ],
    howToChoose: [
      "For image-based welcome cards, Welcomer is the best dedicated option.",
      "For a free, reliable welcome message with embeds, Carl-bot is hard to beat.",
      "If you already use MEE6, its built-in welcome feature is good enough for most servers.",
      "For complex onboarding with conditions and multiple steps, YAGPDB is most powerful.",
    ],
    relatedSlugs: ["moderation", "verification", "leveling"],
    faqs: [
      { q: "How do I add a welcome message to Discord?", a: "Use a bot like Carl-bot or MEE6. Both let you configure a #welcome channel where new members get a personalised greeting automatically. Most take under 5 minutes to set up." },
      { q: "What is the best Discord bot for welcome images?", a: "Welcomer is the specialist — it creates custom welcome cards with the member's avatar, username, and a background of your choice. Completely free for basic use." },
      { q: "Can I send a DM welcome to new Discord members?", a: "Yes — MEE6 and Carl-bot both support DM welcome messages. Note that some members have DMs disabled, so always have a welcome channel as the primary method." },
    ],
  },
  {
    slug: "leveling",
    name: "Leveling",
    emoji: "⬆️",
    headline: "Best Discord leveling bots in 2025",
    description:
      "Keep your community engaged with XP, levels, and leaderboards. These Discord leveling bots reward active members and create a healthy activity loop.",
    bots: [
      { name: "MEE6", description: "The most widely-used leveling bot. XP for messages, role rewards at milestones, and leaderboards.", free: false, highlight: "Most popular" },
      { name: "Arcane", description: "Clean leveling system with voice XP support and customisable rewards. A strong free alternative to MEE6.", free: true, highlight: "Best free leveling" },
      { name: "Tatsu", description: "Full economy and leveling system with a global leaderboard across all Tatsu servers.", free: true, highlight: "Global leaderboard" },
      { name: "UnbelievaBoat", description: "Economy-focused bot with leveling, currency, and games. Great for engagement-heavy servers.", free: true, highlight: "Best economy + leveling" },
    ],
    howToChoose: [
      "MEE6 is the most popular but requires Premium for advanced features like custom role rewards at specific levels.",
      "Arcane is the best free alternative — it has voice XP and clean design with no premium paywall for basics.",
      "If you want both leveling and a virtual economy, UnbelievaBoat or Tatsu cover both.",
      "For a global community feel, Tatsu's server-agnostic leaderboard can motivate competition.",
    ],
    relatedSlugs: ["welcome", "economy", "moderation"],
    faqs: [
      { q: "What is the best free leveling bot for Discord?", a: "Arcane is the best free leveling bot — it supports both text and voice XP, role rewards, and a clean leaderboard without a premium requirement for basic features." },
      { q: "How do Discord leveling bots work?", a: "Members earn XP by sending messages (and sometimes by time spent in voice channels). Once they reach XP thresholds, they level up — and the bot can automatically assign new roles as rewards." },
      { q: "Can I transfer MEE6 levels to another bot?", a: "Not directly — MEE6 levels are stored in MEE6's system. Some bots like Arcane offer import tools for MEE6 data, but results vary. It's easiest to start fresh on a new server." },
    ],
  },
  {
    slug: "music",
    name: "Music",
    emoji: "🎵",
    headline: "Best Discord music bots in 2025",
    description:
      "Stream music in voice channels with these top Discord music bots. After Groovy and Rythm were shut down, here are the best alternatives in 2025.",
    bots: [
      { name: "Hydra", description: "Supports Spotify, YouTube, SoundCloud, and Apple Music. Clean interface and high audio quality.", free: true, highlight: "Best overall" },
      { name: "Jockie Music", description: "Runs multiple instances so multiple voice channels can play simultaneously. Great for large servers.", free: true, highlight: "Multi-channel" },
      { name: "Chip", description: "Simple, reliable music playback from major platforms. Good for servers that want something that just works.", free: true, highlight: "Most reliable" },
      { name: "FredBoat", description: "Open-source music bot with Spotify and YouTube support. Self-hostable for power users.", free: true, highlight: "Open source" },
    ],
    howToChoose: [
      "Hydra is the best all-round choice for most servers — it supports all major platforms and sounds great.",
      "If your server has multiple active voice channels, Jockie Music's multi-instance support is essential.",
      "For a simple set-and-forget solution, Chip requires minimal configuration.",
      "Tech-savvy server owners who want full control should self-host FredBoat.",
    ],
    relatedSlugs: ["leveling", "economy", "welcome"],
    faqs: [
      { q: "What happened to Groovy and Rythm?", a: "Both were shut down in 2021 following legal pressure from Google/YouTube over terms of service violations. The best modern alternatives are Hydra and Jockie Music." },
      { q: "Can Discord music bots play Spotify?", a: "Yes — Hydra and Jockie Music both support Spotify. Note they stream the audio from a separate source matched to the Spotify track, rather than directly from Spotify's API." },
      { q: "Why does my Discord music bot keep disconnecting?", a: "Usually caused by the bot's server being under load, or Discord's voice server being unstable. Try moving the bot to a different voice channel. If it persists, switch to Chip or Hydra for better reliability." },
    ],
  },
  {
    slug: "economy",
    name: "Economy",
    emoji: "💰",
    headline: "Best Discord economy bots in 2025",
    description:
      "Add a virtual currency, shop, and games to your Discord server. Economy bots are one of the best ways to drive long-term member engagement.",
    bots: [
      { name: "UnbelievaBoat", description: "The most popular economy bot — virtual currency, shops, job commands, and gambling games.", free: true, highlight: "Most popular" },
      { name: "Tatsu", description: "Global economy that works across all Tatsu servers. Members keep their currency as they move between communities.", free: true, highlight: "Global economy" },
      { name: "Dank Memer", description: "Meme-focused economy bot with heists, gambling, and an active developer community.", free: true, highlight: "Most fun" },
      { name: "OwO Bot", description: "Combines a virtual pet system with economy and hunting commands. Highly addictive for members.", free: true, highlight: "Most engaging" },
    ],
    howToChoose: [
      "For a serious virtual economy with a real shop, UnbelievaBoat is the most complete solution.",
      "If memes and fun are central to your server culture, Dank Memer is the most entertaining choice.",
      "OwO Bot's pet system creates surprising long-term retention — worth trying for gaming or anime servers.",
      "Tatsu works best when your community interacts across multiple servers on the platform.",
    ],
    relatedSlugs: ["leveling", "music", "moderation"],
    faqs: [
      { q: "What is the best economy bot for Discord?", a: "UnbelievaBoat is the most feature-complete — it has a currency system, shop, job commands, and gambling, all with a clean dashboard and free tier." },
      { q: "Can Discord economy bots have a real shop?", a: "Yes — UnbelievaBoat supports a custom shop where members can spend virtual currency on roles, custom colours, or any other reward you define." },
      { q: "How do economy bots keep Discord members engaged?", a: "By giving members goals to work towards (saving for a shop item), daily check-ins (currency rewards), and social interactions (heists, gambling). The best economy bots create reasons to be active every day." },
    ],
  },
  {
    slug: "ticketing",
    name: "Ticketing",
    emoji: "🎫",
    headline: "Best Discord ticketing bots in 2025",
    description:
      "Handle support requests, applications, and reports privately with a Discord ticketing bot. These bots create private threads so every issue gets proper attention.",
    bots: [
      { name: "Ticket Tool", description: "The most popular dedicated ticketing bot — panel buttons, custom categories, and transcript logging.", free: true, highlight: "Best overall" },
      { name: "Helper.gg", description: "Clean ticket system with form-based intake and a web dashboard for managing open tickets.", free: false, highlight: "Best dashboard" },
      { name: "Carl-bot", description: "Carl-bot's ticket module covers basic needs and integrates with its broader moderation suite.", free: true, highlight: "If you already use Carl-bot" },
      { name: "YAGPDB", description: "Powerful ticket system with custom forms and conditional routing. Best for complex support workflows.", free: true, highlight: "Most customisable" },
    ],
    howToChoose: [
      "For most servers, Ticket Tool is the right choice — it's free, well-maintained, and easy to configure.",
      "If you manage a large support operation and want a web dashboard, Helper.gg is worth the cost.",
      "If you already use Carl-bot, its built-in ticket module removes the need for a separate bot.",
      "For complex multi-department routing and forms, YAGPDB offers the most control.",
    ],
    relatedSlugs: ["moderation", "logging", "verification"],
    faqs: [
      { q: "What is the best Discord ticketing bot?", a: "Ticket Tool is the most popular and easiest to set up. It creates a button panel in any channel, opens private threads for each ticket, and logs transcripts." },
      { q: "How do Discord ticketing bots work?", a: "Members click a button or run a command to open a ticket. The bot creates a private channel or thread only visible to the member and staff. Staff resolve the issue and close the ticket — which logs a transcript." },
      { q: "Can I use Discord threads for tickets instead of a bot?", a: "Discord's native threads work for simple needs, but a dedicated ticketing bot adds crucial features: transcripts, claim system (so staff don't duplicate work), priority levels, and analytics." },
    ],
  },
  {
    slug: "verification",
    name: "Verification",
    emoji: "✅",
    headline: "Best Discord verification bots in 2025",
    description:
      "Protect your server from bots and raiders with verification bots. Gate access behind a CAPTCHA, phone number, or custom quiz before new members see your channels.",
    bots: [
      { name: "Captcha.bot", description: "Simple image CAPTCHA verification. New members solve a CAPTCHA before getting the Member role. Clean and effective.", free: true, highlight: "Easiest setup" },
      { name: "Wick", description: "Advanced verification with anti-raid and threat-scoring. Automatically escalates verification difficulty during raids.", free: true, highlight: "Best security" },
      { name: "Carl-bot", description: "Carl-bot's verification module handles basic reaction or button-based verification alongside its other features.", free: true, highlight: "If you use Carl-bot" },
      { name: "Kolbot", description: "Verification with custom quiz questions — useful for servers that want new members to prove they've read the rules.", free: true, highlight: "Custom quiz" },
    ],
    howToChoose: [
      "For most servers, Captcha.bot is the simplest and most effective — new members solve a CAPTCHA, get the Member role, and that's it.",
      "For high-risk servers (crypto, NFT, large gaming), Wick's adaptive security is worth adding.",
      "If you want members to answer questions about your rules before joining, Kolbot's quiz system is ideal.",
      "If you already use Carl-bot, use its verification module to keep your bot count low.",
    ],
    relatedSlugs: ["moderation", "welcome", "ticketing"],
    faqs: [
      { q: "How do I add verification to my Discord server?", a: "Add Captcha.bot or Carl-bot and configure a verification channel. New members land there first, complete the check, and get auto-assigned the Member role which unlocks the rest of the server." },
      { q: "Does Discord have built-in verification?", a: "Yes — Discord's Safety Setup lets you require phone verification or set a minimum account age. For most servers, combining Discord's native settings with a CAPTCHA bot provides good protection." },
      { q: "What is the best bot to stop Discord raids?", a: "Wick is the specialist — it monitors join rates and account ages, auto-bans suspicious accounts during raids, and lets you lock the server with one command." },
    ],
  },
  {
    slug: "logging",
    name: "Logging",
    emoji: "📋",
    headline: "Best Discord logging bots in 2025",
    description:
      "Track everything that happens in your server — deleted messages, edits, bans, role changes, and more. Logging bots are essential for moderation and accountability.",
    bots: [
      { name: "Carl-bot", description: "The most comprehensive free logging bot — logs message edits, deletions, joins, leaves, bans, role changes, and voice events.", free: true, highlight: "Best overall" },
      { name: "Logger", description: "Dedicated logging bot with a clean per-event channel setup and highly granular control.", free: true, highlight: "Most granular" },
      { name: "Dyno", description: "Solid logging as part of its broader moderation suite. Good if you already use Dyno.", free: true, highlight: "If you use Dyno" },
      { name: "GiselleBot", description: "Detailed logs with attachment caching — it stores images before they're deleted so you can review them later.", free: true, highlight: "Attachment logging" },
    ],
    howToChoose: [
      "Carl-bot is the best all-round choice — its logging is comprehensive, free, and pairs with its moderation features.",
      "If you need to catch image/file deletions, GiselleBot's attachment caching is unique and valuable.",
      "For the most granular per-event routing (each log type in its own channel), use Logger.",
      "If you already use Dyno, its built-in logging is sufficient for most servers.",
    ],
    relatedSlugs: ["moderation", "verification", "ticketing"],
    faqs: [
      { q: "What does a Discord logging bot do?", a: "Logging bots post an event record to a private staff channel whenever something happens — a message is deleted, a member is banned, a role is changed. This creates an audit trail for moderation decisions." },
      { q: "Can Discord log deleted messages?", a: "Discord itself doesn't store deleted messages, but logging bots like Carl-bot cache messages and post them to a log channel when deleted. This only works for messages sent after the bot was added." },
      { q: "What should I log in a Discord server?", a: "At minimum: message deletions, message edits, member joins and leaves, and ban/kick actions. For more security: role changes, channel edits, and voice join/leave events." },
    ],
  },
];

export function getBotCategory(slug: string): BotCategory | undefined {
  return BOT_CATEGORIES.find((c) => c.slug === slug);
}
