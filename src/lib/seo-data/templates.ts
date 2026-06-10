export type Channel = { name: string; purpose: string };
export type Role = { name: string; purpose: string; color?: string };
export type BotRec = { name: string; purpose: string };
export type FAQ = { q: string; a: string };
export type SetupStep = { title: string; body: string };
export type Mistake = { mistake: string; fix: string };

export type ServerTemplate = {
  slug: string;
  name: string;
  emoji: string;
  headline: string;
  description: string;
  useCase: string;
  channels: Channel[];
  roles: Role[];
  bots: BotRec[];
  features: string[];
  stats: { avgChannels: number; avgRoles: number; avgMembers: string };
  relatedSlugs: string[];
  faqs: FAQ[];
  /* ── Optional deep-content fields (populated for beachhead pages) ── */
  intro?: string;
  setupGuide?: SetupStep[];
  mistakes?: Mistake[];
  /** Bot-category slugs (see bot-categories.ts) — rendered as /bots/[slug] links */
  relatedBots?: string[];
  /** Comparison slugs (see comparisons.ts) — rendered as /vs/[slug] links */
  relatedComparisons?: string[];
};

export const TEMPLATES: ServerTemplate[] = [
  {
    slug: "gaming-server",
    name: "Gaming Server",
    emoji: "🎮",
    headline: "The perfect Discord gaming server template",
    description:
      "Everything you need to run a thriving gaming community — organised channels by game, voice lobbies, role-based access, and the bots that keep it running.",
    useCase: "Gaming clans, esports teams, multi-game communities",
    channels: [
      { name: "📋│rules", purpose: "Server rules and community guidelines" },
      { name: "📢│announcements", purpose: "Server news, events and updates" },
      { name: "👋│introductions", purpose: "New members introduce themselves" },
      { name: "💬│general", purpose: "Off-topic chat for all members" },
      { name: "🎮│looking-for-group", purpose: "Find teammates for any game" },
      { name: "🏆│achievements", purpose: "Share wins, clips and highlights" },
      { name: "🎲│game-night", purpose: "Coordinate organised game nights" },
      { name: "🛒│marketplace", purpose: "Trade in-game items and accounts" },
      { name: "🤖│bot-commands", purpose: "Use bots without cluttering chat" },
    ],
    roles: [
      { name: "Admin", purpose: "Full server control", color: "#e74c3c" },
      { name: "Moderator", purpose: "Enforce rules and manage members", color: "#e67e22" },
      { name: "Veteran", purpose: "Long-standing trusted members", color: "#9b59b6" },
      { name: "Member", purpose: "Verified members with full access", color: "#3498db" },
      { name: "New Recruit", purpose: "Recently joined, limited access" },
    ],
    bots: [
      { name: "MEE6", purpose: "Leveling, moderation and welcome messages" },
      { name: "Carl-bot", purpose: "Reaction roles and advanced logging" },
      { name: "Statbot", purpose: "Server analytics and member stats" },
    ],
    features: ["XP leveling", "Voice lobbies", "Reaction roles", "Auto-moderation", "Game night scheduling"],
    stats: { avgChannels: 18, avgRoles: 8, avgMembers: "500–5,000" },
    relatedSlugs: ["anime-server", "roleplay-server", "developer-server"],
    intro:
      "A gaming server lives or dies on two things: how fast new members find people to play with, and how little friction there is between joining and getting into a voice channel. The structure below is built around that — a lightweight info section up top, a single busy #general so the server never feels dead, and game-specific spaces that members opt into rather than being dumped into all at once. Start lean and add game channels as demand appears; an empty channel reads as a dead community even when the server is active.",
    setupGuide: [
      { title: "Lock down the front door first", body: "Set @everyone to read-only on every channel except #rules and a verification gate. New joiners should land on the rules, agree, and only then unlock the rest. This single step stops the vast majority of raid and spam damage before it starts." },
      { title: "Keep one busy general, not five quiet ones", body: "Early on, funnel all chat into #general. A single active channel feels alive; five half-used ones feel abandoned. Split out game-specific channels (#valorant, #minecraft) only once #general is consistently busy enough that topics are colliding." },
      { title: "Use opt-in game roles with reaction roles", body: "Set up a reaction-role message where members pick the games they play. Those roles can gate game-specific channels and let you @mention only the people who care when you organise a session — no @everyone spam." },
      { title: "Set up looking-for-group properly", body: "#looking-for-group is the highest-value channel in most gaming servers. Add a slow-mode of 30–60s so it doesn't get flooded, and pin a one-line format (game, region, mic?, how many needed) so posts are actually usable." },
      { title: "Schedule recurring game nights", body: "Communities die in the gap between events. Use a scheduling bot or a Discord Scheduled Event for a weekly recurring game night. Predictable, recurring touchpoints retain members far better than one-off hype." },
    ],
    mistakes: [
      { mistake: "Creating 20+ channels on day one", fix: "Members read an empty server as a dead server. Launch with 8–10 channels and add more only when existing ones are visibly busy." },
      { mistake: "Using @everyone for every event ping", fix: "Mass pings train members to mute the server. Use opt-in game roles and ping only the relevant role." },
      { mistake: "No verification gate", fix: "An open server is a magnet for spam bots and raiders. Add a one-click verification step before members can post." },
      { mistake: "Letting voice channels sit empty and visible", fix: "A wall of empty voice channels looks dead. Use a single 'lobby' that auto-creates temporary rooms, or hide overflow voice until needed." },
    ],
    relatedBots: ["leveling", "moderation", "welcome"],
    relatedComparisons: ["mee6", "carl-bot"],
    faqs: [
      { q: "How many channels should a gaming server have?", a: "Most successful gaming servers have 15–25 channels split across info, chat, voice, and game-specific sections. Too few feels bare; too many overwhelms new members." },
      { q: "What roles does a gaming server need?", a: "At minimum: Admin, Moderator, Member, and New Recruit. Many gaming servers also add game-specific roles (e.g. 'Valorant', 'Minecraft') so members can opt into relevant channels." },
      { q: "What's the best bot for a gaming server?", a: "MEE6 is the most popular choice for leveling and moderation. Pair it with Carl-bot for reaction roles and you've covered 90% of gaming server needs." },
    ],
  },
  {
    slug: "study-group",
    name: "Study Group",
    emoji: "📚",
    headline: "The ideal Discord study group template",
    description:
      "A calm, distraction-free template for students and learners — subject channels, accountability rooms, resource sharing, and focus timers.",
    useCase: "Students, exam prep groups, online courses, book clubs",
    channels: [
      { name: "📋│rules", purpose: "Community guidelines and study etiquette" },
      { name: "📢│announcements", purpose: "Important updates and deadlines" },
      { name: "👋│introductions", purpose: "Who you are and what you're studying" },
      { name: "💬│general", purpose: "Off-topic and social chat" },
      { name: "📖│study-chat", purpose: "Questions, discussion and collaboration" },
      { name: "📝│resources", purpose: "Links, notes and study materials" },
      { name: "⏱️│focus-sessions", purpose: "Pomodoro and group focus sprints" },
      { name: "✅│accountability", purpose: "Daily goals and progress check-ins" },
      { name: "🎉│wins", purpose: "Share grades, completions and breakthroughs" },
    ],
    roles: [
      { name: "Admin", purpose: "Server owner and management", color: "#e74c3c" },
      { name: "Tutor", purpose: "Qualified helpers and course creators", color: "#f39c12" },
      { name: "Study Buddy", purpose: "Active, verified members", color: "#27ae60" },
      { name: "New Student", purpose: "Recently joined" },
    ],
    bots: [
      { name: "Study Together", purpose: "Pomodoro timers and focus sessions" },
      { name: "Carl-bot", purpose: "Role assignment and logging" },
      { name: "Maven", purpose: "Surface past answered questions automatically" },
    ],
    features: ["Pomodoro timers", "Subject channels", "Resource pinning", "Accountability check-ins", "Q&A history with Maven"],
    stats: { avgChannels: 12, avgRoles: 4, avgMembers: "50–500" },
    relatedSlugs: ["developer-server", "book-club", "business-server"],
    intro:
      "A study server has the opposite problem to a gaming server: the goal is calm, not energy. Too many channels and too much off-topic chatter actively hurt — they pull people out of focus. The structure below is deliberately small. The two channels that matter most are #accountability (where members post daily goals and get gentle social pressure to follow through) and a shared focus space for body-doubling. Everything else is support. Resist the urge to add a channel for every subject until the membership is large enough to fill them.",
    setupGuide: [
      { title: "Keep off-topic in exactly one place", body: "Confine all social and off-topic chat to a single #general. A study server's value is focus; if casual chat spreads across channels, the studious members quietly leave. One contained outlet is enough." },
      { title: "Set up a focus / body-doubling room", body: "Add a voice channel for silent co-working (cameras optional, mics muted) plus a Pomodoro bot for synced 25/5 sprints. Studying 'alongside' others is the single biggest retention driver for study communities." },
      { title: "Make #accountability a daily ritual", body: "Pin a simple format: today's goal in the morning, a check-in at night. Public, low-stakes commitments dramatically raise follow-through. This channel is the heart of the server — protect it from noise." },
      { title: "Build a searchable resource library", body: "Use a #resources channel with pinned messages or forum threads per subject. Add a bot like Maven so previously-answered questions resurface automatically — exam season otherwise repeats the same questions endlessly." },
      { title: "Verify before granting access", body: "A light verification step (even a single button) keeps drive-by spam out and signals that this is a focused space, not a random chat server." },
    ],
    mistakes: [
      { mistake: "One channel per subject from the start", fix: "With 50 members, ten subject channels are all empty. Start with one #study-chat and split by subject only once a topic is clearly overflowing." },
      { mistake: "Letting #general drown out studying", fix: "Unmoderated social chat erodes the focus that drew people in. Keep #general contained and steer study questions into their own channel." },
      { mistake: "No way to resurface past answers", fix: "The same questions get asked every term. A Q&A-indexing bot like Maven turns answered questions into a searchable knowledge base." },
      { mistake: "No recurring focus sessions", fix: "Without a scheduled rhythm, members drift. Run daily or weekly Pomodoro sprints at a fixed time so showing up becomes a habit." },
    ],
    relatedBots: ["welcome", "verification", "logging"],
    relatedComparisons: ["mee6", "carl-bot"],
    faqs: [
      { q: "How do you keep a study Discord focused?", a: "Keep off-topic chat to a single #general channel. Use subject-specific channels so discussions stay relevant. A bot like Maven helps surface previous Q&As so the same questions don't get asked repeatedly." },
      { q: "What's the best bot for a study server?", a: "Maven by GuildLabs is purpose-built for this: it indexes every question asked and automatically surfaces the answer when someone asks again — perfect for study groups that repeat the same questions every exam season." },
      { q: "How many people should be in a study Discord?", a: "Study servers work best at 20–200 members. Below that, conversations dry up. Above 500, it starts feeling impersonal and moderation becomes a full-time job." },
    ],
  },
  {
    slug: "crypto-community",
    name: "Crypto Community",
    emoji: "₿",
    headline: "The go-to Discord crypto community template",
    description:
      "Built for token communities, DAOs, and DeFi projects — price alerts, governance channels, holder roles, and anti-scam protection baked in.",
    useCase: "Token communities, DAOs, DeFi projects, NFT projects",
    channels: [
      { name: "📋│rules", purpose: "Community rules and anti-scam policy" },
      { name: "📢│announcements", purpose: "Official project updates" },
      { name: "💬│general", purpose: "Open community chat" },
      { name: "📈│price-talk", purpose: "Price discussion and market analysis" },
      { name: "🗳️│governance", purpose: "Proposals and voting discussion" },
      { name: "🔧│developers", purpose: "Technical discussion and dev updates" },
      { name: "🎨│nft-showcase", purpose: "Share and discuss NFTs" },
      { name: "🚨│scam-reports", purpose: "Report suspicious activity" },
      { name: "🤝│partnerships", purpose: "Collaboration and partnership proposals" },
    ],
    roles: [
      { name: "Core Team", purpose: "Project founders and full-time team", color: "#f39c12" },
      { name: "Moderator", purpose: "Community managers", color: "#e74c3c" },
      { name: "Whale", purpose: "Top token holders", color: "#9b59b6" },
      { name: "Holder", purpose: "Verified token holders", color: "#3498db" },
      { name: "Community", purpose: "General members" },
    ],
    bots: [
      { name: "Carl-bot", purpose: "Role assignment for verified holders" },
      { name: "Wick", purpose: "Anti-raid and scam protection" },
      { name: "Tip.cc", purpose: "Crypto tipping in chat" },
    ],
    features: ["Holder verification", "Anti-scam protection", "Governance channels", "Price discussion", "Role gating"],
    stats: { avgChannels: 16, avgRoles: 6, avgMembers: "1,000–50,000" },
    relatedSlugs: ["nft-community", "developer-server", "business-server"],
    intro:
      "A crypto community server is a security project first and a community second. These servers are the single most targeted type on Discord — scammers impersonate the team, post fake mint links, and DM members within seconds of joining. The structure below assumes you're under attack from day one: locked-down permissions, a verification wall, isolated price chatter, and a clear reporting path. Get the security layer right before you worry about engagement, because one successful scam DM can destroy community trust permanently.",
    setupGuide: [
      { title: "Verify before anyone can see anything", body: "New members should land on a single verification channel and nothing else. Use a CAPTCHA or anti-raid bot so automated scam accounts can't get past the gate. Only grant the Member role — and visibility of the rest of the server — after verification." },
      { title: "Make impersonation impossible to miss", body: "Pin a message stating clearly: the team will NEVER DM first. Give team members a distinct coloured role that sits at the top of the list. Disable DMs from server members in the server's privacy settings where possible." },
      { title: "Isolate price talk", body: "Keep #price-talk in its own channel with the expectation that it stays there. Price chatter otherwise dominates every channel and drowns out governance, dev updates, and support — the things that actually build a durable community." },
      { title: "Gate holder-only channels by wallet", body: "Use a wallet-verification bot (Collab.Land, Guild.xyz) to assign holder roles based on on-chain balances. This powers token-gated channels and governance voting without manual checks." },
      { title: "Give scams a one-click reporting path", body: "Add a #scam-reports channel and a reaction or button members can use to flag suspicious accounts. Fast community reporting plus an anti-raid bot is the most effective defence against coordinated attacks." },
    ],
    mistakes: [
      { mistake: "Letting new members post immediately", fix: "Scam bots post fake links within seconds of joining. A verification wall before any posting access is non-negotiable for crypto servers." },
      { mistake: "No clear 'team never DMs first' policy", fix: "Impersonation is the #1 attack. State the policy loudly, give the team a distinctive role, and repeat it often." },
      { mistake: "Price talk bleeding into every channel", fix: "Contain it to #price-talk so governance, dev, and support channels stay usable." },
      { mistake: "Relying on manual moderation against raids", fix: "Humans can't outpace a coordinated raid. Deploy an anti-raid bot with auto-escalation (e.g. Wick) before you need it." },
    ],
    relatedBots: ["verification", "moderation", "logging"],
    relatedComparisons: ["carl-bot", "dyno"],
    faqs: [
      { q: "How do you verify token holders in Discord?", a: "Use a bot like Collab.Land or Guild.xyz to verify wallet ownership and automatically assign holder roles. This gates exclusive channels to verified community members." },
      { q: "How do you prevent scams in a crypto Discord?", a: "Enable slow mode in public channels, disable DMs from non-members, use a verification bot, and add a dedicated #scam-reports channel. Wick bot is excellent for anti-raid protection." },
      { q: "What channels does a crypto project Discord need?", a: "Must-haves: #announcements, #general, #price-talk, #governance, and a scam-reports channel. Keep price discussion in its own channel to avoid it dominating the whole server." },
    ],
  },
  {
    slug: "anime-server",
    name: "Anime Server",
    emoji: "⛩️",
    headline: "The best Discord anime server template",
    description:
      "For anime fans, fan communities, and seasonal watch-alongs — series channels, spoiler protection, waifu bots, and a welcoming community structure.",
    useCase: "Anime fan communities, seasonal watch-alongs, manga clubs",
    channels: [
      { name: "📋│rules", purpose: "Community rules and spoiler policy" },
      { name: "📢│announcements", purpose: "Server news and new season alerts" },
      { name: "💬│general", purpose: "General anime chat" },
      { name: "📺│now-watching", purpose: "Current season discussion" },
      { name: "🔖│recommendations", purpose: "Suggest and discover anime" },
      { name: "⚠️│spoilers", purpose: "Spoiler discussion (clearly labelled)" },
      { name: "🎨│fan-art", purpose: "Share fan art and edits" },
      { name: "📖│manga", purpose: "Manga discussion and recommendations" },
      { name: "🤖│bot-commands", purpose: "Waifu and anime bot commands" },
    ],
    roles: [
      { name: "Admin", purpose: "Server management", color: "#e74c3c" },
      { name: "Moderator", purpose: "Keep the server friendly", color: "#e67e22" },
      { name: "Senpai", purpose: "Long-time members", color: "#9b59b6" },
      { name: "Weeb", purpose: "Verified members", color: "#3498db" },
      { name: "Lurker", purpose: "New members" },
    ],
    bots: [
      { name: "Mudae", purpose: "Waifu and character claiming game" },
      { name: "AniList", purpose: "Anime and manga lookups" },
      { name: "Carl-bot", purpose: "Reaction roles for favourite genres" },
    ],
    features: ["Spoiler channels", "Seasonal watch-alongs", "Fan art showcase", "Reaction roles by genre", "Anime lookups"],
    stats: { avgChannels: 14, avgRoles: 5, avgMembers: "200–2,000" },
    relatedSlugs: ["gaming-server", "roleplay-server", "art-community"],
    faqs: [
      { q: "How do you handle spoilers in an anime server?", a: "Create a dedicated #spoilers channel and enforce its use via rules. Some servers also use role-gated spoiler channels per series. Make the spoiler policy very clear in your rules channel." },
      { q: "What's the most popular bot for anime servers?", a: "Mudae is the most popular — it lets members 'claim' anime characters in a gacha-style game that keeps engagement high. Pair it with an AniList bot for quick anime lookups." },
      { q: "How do you organise an anime server by season?", a: "Create a new text channel for each new anime season (e.g. #winter-2025) and archive old ones. Use Carl-bot reaction roles so members can subscribe to the genres and seasons they follow." },
    ],
  },
  {
    slug: "music-server",
    name: "Music Server",
    emoji: "🎵",
    headline: "The ultimate Discord music server template",
    description:
      "For musicians, producers, listeners and DJ communities — critique channels, genre rooms, listening parties, and music bot setup.",
    useCase: "Musicians, producers, music fans, DJ communities, band servers",
    channels: [
      { name: "📋│rules", purpose: "Community rules and posting guidelines" },
      { name: "📢│announcements", purpose: "New releases, events and updates" },
      { name: "💬│general", purpose: "General music chat" },
      { name: "🎧│listening-party", purpose: "Coordinated group listening sessions" },
      { name: "🎵│share-your-music", purpose: "Post your original music for feedback" },
      { name: "🎤│critique", purpose: "Constructive feedback on tracks" },
      { name: "🎹│production-tips", purpose: "Production advice and tutorials" },
      { name: "🎸│genre-chat", purpose: "Genre-specific discussion" },
      { name: "🤖│music-bot", purpose: "Queue songs with the music bot" },
    ],
    roles: [
      { name: "Admin", purpose: "Server management", color: "#e74c3c" },
      { name: "Producer", purpose: "Verified music creators", color: "#f39c12" },
      { name: "DJ", purpose: "Community DJs and playlist curators", color: "#9b59b6" },
      { name: "Listener", purpose: "Verified members", color: "#3498db" },
      { name: "New Fan", purpose: "Recently joined" },
    ],
    bots: [
      { name: "Hydra", purpose: "High-quality music playback in voice channels" },
      { name: "Carl-bot", purpose: "Genre reaction roles and logging" },
      { name: "MEE6", purpose: "Leveling and welcome messages" },
    ],
    features: ["Music bot playback", "Listening parties", "Critique channels", "Genre reaction roles", "Release announcements"],
    stats: { avgChannels: 13, avgRoles: 5, avgMembers: "100–1,000" },
    relatedSlugs: ["art-community", "gaming-server", "developer-server"],
    faqs: [
      { q: "What's the best music bot for Discord in 2025?", a: "Hydra and Jockie Music are the top picks after Groovy and Rythm were shut down. They support YouTube, Spotify, SoundCloud and Apple Music playlists." },
      { q: "How do you run listening parties on Discord?", a: "Use a dedicated voice channel and a music bot that supports queue management. Announce the listening party in #announcements at least 24 hours in advance. Watch2gether also works for music videos." },
      { q: "How do you get feedback on music in Discord?", a: "Create a dedicated #critique channel with clear rules: constructive feedback only, include what you like before what you'd change. Some servers require you to critique one track before sharing your own." },
    ],
  },
  {
    slug: "art-community",
    name: "Art Community",
    emoji: "🎨",
    headline: "The best Discord art community template",
    description:
      "A creative space for artists, illustrators, and designers — portfolio channels, critique rooms, art challenges, and commission listings.",
    useCase: "Artists, illustrators, designers, commissioners",
    channels: [
      { name: "📋│rules", purpose: "Community rules and content policy" },
      { name: "📢│announcements", purpose: "Events, challenges and updates" },
      { name: "💬│general", purpose: "General chat" },
      { name: "🖼️│gallery", purpose: "Share finished artwork" },
      { name: "🎨│wip-showcase", purpose: "Works in progress and sketches" },
      { name: "✏️│critique", purpose: "Request and give constructive feedback" },
      { name: "🏆│art-challenges", purpose: "Weekly and monthly art challenges" },
      { name: "💼│commissions", purpose: "Open commission listings" },
      { name: "🛠️│resources", purpose: "Tutorials, brushes and tools" },
    ],
    roles: [
      { name: "Admin", purpose: "Server management", color: "#e74c3c" },
      { name: "Featured Artist", purpose: "Highlighted community creators", color: "#f39c12" },
      { name: "Artist", purpose: "Verified art-sharing members", color: "#9b59b6" },
      { name: "Art Enthusiast", purpose: "Members who appreciate but don't create" },
      { name: "New Member", purpose: "Recently joined" },
    ],
    bots: [
      { name: "Carl-bot", purpose: "Reaction roles and logging" },
      { name: "Statbot", purpose: "Track server engagement and growth" },
      { name: "MEE6", purpose: "Automated welcome and leveling" },
    ],
    features: ["Portfolio channels", "Art challenges", "Commission board", "WIP showcase", "Critique rooms"],
    stats: { avgChannels: 13, avgRoles: 5, avgMembers: "200–3,000" },
    relatedSlugs: ["music-server", "anime-server", "developer-server"],
    intro:
      "An art community succeeds when members feel safe sharing unfinished work and getting honest, kind feedback. The biggest structural decision is separating the gallery (finished pieces, low pressure) from critique (where feedback is explicitly invited) — mixing them makes people afraid to post. Recurring art challenges are the engagement engine: a weekly prompt gives quiet members a reason to create and share. Content moderation also matters more here than in most servers, since image-heavy communities attract both spam and NSFW posting.",
    setupGuide: [
      { title: "Separate gallery from critique", body: "Make #gallery a place to share finished work with no obligation to critique, and #critique the place where feedback is explicitly requested. Conflating them makes members fear judgement on everything they post — and they stop posting." },
      { title: "Set a clear content policy up front", body: "State whether the server is SFW, and if you allow mature work, gate it behind an age-verified role and a separate channel. Image communities attract NSFW posting; an explicit, enforced policy prevents problems before they happen." },
      { title: "Run a recurring art challenge", body: "Post a weekly or monthly prompt in #art-challenges with a clear deadline and a submissions channel. Challenges give members who'd otherwise lurk a reason to create — and winning art seeds the gallery with quality work." },
      { title: "Structure the commissions channel", body: "Require commission posts to include rates, style samples, turnaround, and contact method. A slow-mode keeps it from being spammed. This is one of the most valued channels in any art server — make it usable." },
      { title: "Log images for moderation", body: "Use a logging bot that caches attachments, so deleted images can still be reviewed. With image-heavy servers, after-the-fact moderation review is essential for handling reports fairly." },
    ],
    mistakes: [
      { mistake: "One channel for both finished art and critique", fix: "Members get nervous posting if every share invites criticism. Split low-pressure #gallery from opt-in #critique." },
      { mistake: "No content / NSFW policy", fix: "Image servers attract mature content. Decide your policy, state it clearly, and gate mature work behind an age-verified role." },
      { mistake: "No recurring engagement hook", fix: "Without challenges, only the same few artists post. A weekly prompt pulls in lurkers and keeps the gallery fresh." },
      { mistake: "Unstructured commission posts", fix: "Free-form commission ads are noise. Require rates, samples, turnaround, and contact so the channel stays useful." },
    ],
    relatedBots: ["welcome", "leveling", "logging"],
    relatedComparisons: ["mee6", "carl-bot"],
    faqs: [
      { q: "How do you moderate content in an art Discord?", a: "Set clear content policies (e.g. SFW by default), use image logging bots like Carl-bot to review posted images, and have a separate NSFW channel gated by an age-verified role if needed." },
      { q: "How do you run art challenges in Discord?", a: "Post weekly or monthly prompts in #art-challenges with a clear deadline. Create a submissions channel, then vote on winners with emoji reactions. Pin or feature winning artwork in the gallery." },
      { q: "Should artists share commissions in Discord?", a: "Yes — a dedicated #commissions channel is one of the most valued channels in art servers. Require posters to include their rates, style, turnaround time, and contact method." },
    ],
  },
  {
    slug: "developer-server",
    name: "Developer Server",
    emoji: "💻",
    headline: "The ideal Discord developer community template",
    description:
      "For dev communities, open-source projects, and coding bootcamps — language channels, code review rooms, job boards, and productivity bots.",
    useCase: "Dev communities, open-source projects, bootcamps, hackathons",
    channels: [
      { name: "📋│rules", purpose: "Community rules and code of conduct" },
      { name: "📢│announcements", purpose: "Project updates and community news" },
      { name: "💬│general", purpose: "General developer chat" },
      { name: "❓│help", purpose: "Ask and answer technical questions" },
      { name: "🔍│code-review", purpose: "Share code snippets for review" },
      { name: "💼│jobs-and-hiring", purpose: "Job postings and hiring" },
      { name: "🚀│projects", purpose: "Share what you're building" },
      { name: "📚│resources", purpose: "Tutorials, docs and learning materials" },
      { name: "🤖│bot-commands", purpose: "Bot usage without chat noise" },
    ],
    roles: [
      { name: "Admin", purpose: "Server management", color: "#e74c3c" },
      { name: "Contributor", purpose: "Active open-source contributors", color: "#f39c12" },
      { name: "Senior Dev", purpose: "Experienced developers", color: "#9b59b6" },
      { name: "Developer", purpose: "Verified members", color: "#3498db" },
      { name: "Student", purpose: "Learning to code" },
    ],
    bots: [
      { name: "Maven", purpose: "Automatically surface past answered questions — critical for #help channels" },
      { name: "Carl-bot", purpose: "Language reaction roles and logging" },
      { name: "Statbot", purpose: "Community analytics" },
    ],
    features: ["Language-specific channels", "Code review room", "Job board", "Q&A memory with Maven", "GitHub integration"],
    stats: { avgChannels: 16, avgRoles: 6, avgMembers: "100–5,000" },
    relatedSlugs: ["study-group", "business-server", "startup-community"],
    faqs: [
      { q: "How do you organise a developer Discord by programming language?", a: "Use Carl-bot reaction roles so members self-assign language roles (Python, JavaScript, Rust, etc.), then create language-specific channels gated by those roles. This keeps the server manageable as it grows." },
      { q: "What's the best bot for a developer Discord's help channel?", a: "Maven by GuildLabs — it automatically indexes every question asked in #help and links back to the answer the next time someone asks the same thing. Essential for any technical community where questions repeat." },
      { q: "Should developer servers have a job board channel?", a: "Yes, absolutely. Job and hiring channels consistently drive the most engagement in developer servers after #general. Require a standard format: role, salary range, tech stack, and a link or contact." },
    ],
  },
  {
    slug: "business-server",
    name: "Business Server",
    emoji: "💼",
    headline: "The professional Discord business server template",
    description:
      "For startups, agencies, and professional communities — team channels, client areas, announcement feeds, and CRM-style organisation.",
    useCase: "Startups, agencies, professional communities, SaaS companies",
    channels: [
      { name: "📋│rules", purpose: "Community guidelines and professional conduct" },
      { name: "📢│announcements", purpose: "Company and product updates" },
      { name: "💬│general", purpose: "General team chat" },
      { name: "💡│ideas", purpose: "Suggestions and brainstorming" },
      { name: "📊│metrics", purpose: "Shared KPIs and performance updates" },
      { name: "🤝│partnerships", purpose: "Partnership and collaboration requests" },
      { name: "🎤│networking", purpose: "Introductions and professional connections" },
      { name: "📰│industry-news", purpose: "Relevant news and trend sharing" },
      { name: "🛠️│tools-and-resources", purpose: "Useful tools, templates and guides" },
    ],
    roles: [
      { name: "Admin", purpose: "Server management", color: "#e74c3c" },
      { name: "Team", purpose: "Internal team members", color: "#f39c12" },
      { name: "Partner", purpose: "Verified partner companies", color: "#9b59b6" },
      { name: "Community", purpose: "General members", color: "#3498db" },
      { name: "Guest", purpose: "Temporary or prospective members" },
    ],
    bots: [
      { name: "Carl-bot", purpose: "Role management and logging" },
      { name: "Maven", purpose: "Surface past answers in #help and #general" },
      { name: "Zapier / Make", purpose: "Connect Discord to your business stack" },
    ],
    features: ["Team channels", "Partner access", "Metrics sharing", "Resource library", "Professional networking"],
    stats: { avgChannels: 14, avgRoles: 5, avgMembers: "50–500" },
    relatedSlugs: ["developer-server", "startup-community", "crypto-community"],
    faqs: [
      { q: "Can Discord work as a team communication tool?", a: "Yes — many startups use Discord instead of Slack for its lower cost (free tier is generous) and stronger voice/video features. The key is good channel organisation and role-gating internal vs. community areas." },
      { q: "How do you keep a business Discord professional?", a: "Set clear professional conduct rules, use role gating to separate team-only channels from public ones, and enable slow mode in community channels to reduce noise." },
      { q: "What integrations work well in a business Discord?", a: "Zapier and Make.com both have Discord connectors — use them to post GitHub commits, Notion updates, Stripe alerts, or any other business event directly to a Discord channel." },
    ],
  },
  {
    slug: "roleplay-server",
    name: "Roleplay Server",
    emoji: "🎭",
    headline: "The complete Discord roleplay server template",
    description:
      "For text-based RP communities, fantasy worlds, and collaborative storytelling — world-lore channels, character sheets, IC/OOC separation, and campaign organisation.",
    useCase: "Text RP, fantasy communities, DnD campaigns, collaborative fiction",
    channels: [
      { name: "📋│rules", purpose: "Server rules and RP guidelines" },
      { name: "📖│lore", purpose: "World lore, history and setting details" },
      { name: "📝│character-sheets", purpose: "Submit and browse character profiles" },
      { name: "💬│ooc-general", purpose: "Out-of-character chat" },
      { name: "🌆│rp-town-square", purpose: "Main in-character RP location" },
      { name: "🏰│rp-castle", purpose: "Secondary RP location" },
      { name: "⚔️│rp-arena", purpose: "Combat and event RP" },
      { name: "📜│plot-discussion", purpose: "Story direction and arc planning" },
      { name: "🎲│dice-rolls", purpose: "Use dice bot for game mechanics" },
    ],
    roles: [
      { name: "Admin", purpose: "Server and story management", color: "#e74c3c" },
      { name: "Game Master", purpose: "Run campaigns and events", color: "#f39c12" },
      { name: "Veteran RPer", purpose: "Experienced members", color: "#9b59b6" },
      { name: "Character", purpose: "Active RP participant with approved sheet", color: "#3498db" },
      { name: "Observer", purpose: "Reading along, not yet participating" },
    ],
    bots: [
      { name: "Dice Maiden", purpose: "Dice rolling for tabletop mechanics" },
      { name: "Carl-bot", purpose: "Reaction roles and auto-moderation" },
      { name: "Tupperbox", purpose: "Character-specific messages (proxy system)" },
    ],
    features: ["IC/OOC separation", "Character sheet channel", "Lore library", "Dice rolling", "Proxy messaging"],
    stats: { avgChannels: 15, avgRoles: 6, avgMembers: "50–500" },
    relatedSlugs: ["gaming-server", "anime-server", "book-club"],
    faqs: [
      { q: "How do you separate in-character and out-of-character in Discord?", a: "Prefix all IC channel names (e.g. #rp-town-square) and OOC channels (e.g. #ooc-general). Many servers also use Tupperbox — a bot that lets you post as your character with a custom name and avatar." },
      { q: "How do you manage lore in a roleplay Discord?", a: "Create a dedicated #lore channel or section that is read-only for regular members. Pin lore documents and update them as the story evolves. Some servers use Google Docs for detailed world-building and link from Discord." },
      { q: "What bot do most roleplay servers use?", a: "Tupperbox is the most RP-specific bot — it lets members post as their characters. Dice Maiden handles tabletop mechanics. Carl-bot handles everything else (roles, logging, auto-mod)." },
    ],
  },
  {
    slug: "nft-community",
    name: "NFT Community",
    emoji: "🖼️",
    headline: "The essential Discord NFT community template",
    description:
      "Built for NFT projects and collector communities — holder verification, whitelist channels, mint announcements, and alpha sharing.",
    useCase: "NFT projects, collector communities, Web3 art drops",
    channels: [
      { name: "📋│rules", purpose: "Community rules and anti-scam policy" },
      { name: "📢│announcements", purpose: "Mint dates, updates and news" },
      { name: "💬│general", purpose: "Community chat" },
      { name: "🖼️│showcase", purpose: "Show off your NFTs" },
      { name: "💎│holder-chat", purpose: "Exclusive channel for verified holders" },
      { name: "⬜│whitelist", purpose: "WL giveaways and mint access info" },
      { name: "📈│alpha", purpose: "Trading signals and project alpha" },
      { name: "🤝│collabs", purpose: "Partnership and collaboration proposals" },
      { name: "🚨│scam-reports", purpose: "Report suspicious DMs and links" },
    ],
    roles: [
      { name: "Core Team", purpose: "Project founders and team", color: "#f39c12" },
      { name: "Moderator", purpose: "Community managers", color: "#e74c3c" },
      { name: "Verified Holder", purpose: "Verified NFT owners", color: "#9b59b6" },
      { name: "Whitelist", purpose: "Approved for mint access", color: "#3498db" },
      { name: "Community", purpose: "General members" },
    ],
    bots: [
      { name: "Collab.Land", purpose: "Token-gate channels for verified holders" },
      { name: "Wick", purpose: "Anti-raid and DM scam protection" },
      { name: "Carl-bot", purpose: "Role management and logging" },
    ],
    features: ["Holder verification", "Anti-scam protection", "WL management", "Alpha channels", "Token gating"],
    stats: { avgChannels: 14, avgRoles: 6, avgMembers: "1,000–20,000" },
    relatedSlugs: ["crypto-community", "art-community", "business-server"],
    faqs: [
      { q: "How do you verify NFT holders in Discord?", a: "Use Collab.Land — it's the industry standard for NFT projects. It connects to members' wallets and assigns roles based on what they hold. Holders automatically lose access if they sell." },
      { q: "How do you protect an NFT Discord from scams?", a: "Disable DMs from non-members (Server Settings → Safety Setup), use Wick bot for raid protection, add a scam-reports channel, and never DM members first about mints or giveaways." },
      { q: "What channels should an NFT project Discord launch with?", a: "Start with: #announcements, #general, #showcase, #whitelist, #holder-chat (gated), and #scam-reports. Add alpha channels only once you have enough active holders to make them worth it." },
    ],
  },
  {
    slug: "startup-community",
    name: "Startup Community",
    emoji: "🚀",
    headline: "The best Discord startup community template",
    description:
      "For founders, investors, and startup ecosystem players — fundraising channels, founder AMAs, co-founder matching, and deal-sharing.",
    useCase: "Founders, investors, accelerators, startup ecosystems",
    channels: [
      { name: "📋│rules", purpose: "Community guidelines" },
      { name: "📢│announcements", purpose: "Community news and events" },
      { name: "💬│general", purpose: "Founder chat" },
      { name: "🚀│show-your-startup", purpose: "Share what you're building" },
      { name: "🤝│co-founder-matching", purpose: "Find technical or business co-founders" },
      { name: "💰│fundraising", purpose: "Investor intros and funding advice" },
      { name: "📣│feedback-wanted", purpose: "Get feedback on your product or pitch" },
      { name: "💼│hiring", purpose: "Recruit for your startup" },
      { name: "🎤│ama", purpose: "Founder and investor AMAs" },
    ],
    roles: [
      { name: "Admin", purpose: "Community management", color: "#e74c3c" },
      { name: "Investor", purpose: "Verified investors and angels", color: "#f39c12" },
      { name: "Founder", purpose: "Verified startup founders", color: "#9b59b6" },
      { name: "Builder", purpose: "Active side-project builders", color: "#3498db" },
      { name: "Member", purpose: "General community" },
    ],
    bots: [
      { name: "Carl-bot", purpose: "Role assignment and logging" },
      { name: "Maven", purpose: "Surface past founder Q&As and advice" },
      { name: "MEE6", purpose: "Welcome and leveling" },
    ],
    features: ["Founder showcase", "Co-founder matching", "Investor access", "AMA events", "Feedback channels"],
    stats: { avgChannels: 13, avgRoles: 5, avgMembers: "200–2,000" },
    relatedSlugs: ["business-server", "developer-server", "crypto-community"],
    faqs: [
      { q: "How do you build a quality startup Discord community?", a: "Gate membership — require an application or referral. Quality matters more than size for startup communities. A vetted community of 200 engaged founders beats an open server of 5,000 lurkers." },
      { q: "How do you run investor AMAs on Discord?", a: "Schedule in #announcements 1–2 weeks in advance. Use a dedicated #ama channel with slow mode on. Have a moderator queue questions. Record the session if possible and post a summary." },
      { q: "What's the best way to do co-founder matching on Discord?", a: "Use a structured format in #co-founder-matching: background, what you're building, what you're looking for, and how to reach you. Prompt new members to post on join." },
    ],
  },
  {
    slug: "book-club",
    name: "Book Club",
    emoji: "📖",
    headline: "The perfect Discord book club template",
    description:
      "For reading communities, literary circles, and bookish friends — chapter discussion channels, reading schedules, book picks, and spoiler protection.",
    useCase: "Book clubs, reading communities, literary discussion groups",
    channels: [
      { name: "📋│rules", purpose: "Community rules and spoiler policy" },
      { name: "📢│announcements", purpose: "Book picks and reading schedule" },
      { name: "💬│general", purpose: "General bookish chat" },
      { name: "📖│current-read", purpose: "Discussion of the current book" },
      { name: "⚠️│spoilers", purpose: "Full-book spoiler discussion" },
      { name: "📚│recommendations", purpose: "Suggest and discover books" },
      { name: "✍️│quotes", purpose: "Share favourite passages" },
      { name: "🗳️│book-votes", purpose: "Vote on the next book pick" },
      { name: "🎤│author-talks", purpose: "Author events and Q&As" },
    ],
    roles: [
      { name: "Admin", purpose: "Community management", color: "#e74c3c" },
      { name: "Librarian", purpose: "Book curators and moderators", color: "#f39c12" },
      { name: "Bookworm", purpose: "Active readers", color: "#3498db" },
      { name: "New Reader", purpose: "Recently joined" },
    ],
    bots: [
      { name: "Carl-bot", purpose: "Reaction roles for genre preferences" },
      { name: "Maven", purpose: "Surface past book discussions when re-reads happen" },
      { name: "MEE6", purpose: "Welcome messages and leveling" },
    ],
    features: ["Chapter discussions", "Spoiler protection", "Book voting", "Genre roles", "Quote sharing"],
    stats: { avgChannels: 11, avgRoles: 4, avgMembers: "20–300" },
    relatedSlugs: ["study-group", "anime-server", "roleplay-server"],
    faqs: [
      { q: "How do you organise book discussions in Discord without spoilers?", a: "Have a #current-read channel for non-spoiler discussion and a separate #spoilers channel. Make the spoiler policy crystal clear in #rules and pin it in both channels." },
      { q: "How do you pick the next book in a Discord book club?", a: "A #book-votes channel works well — members nominate books, then you run a poll using Discord's built-in polls or a bot. Set a deadline and announce the winner in #announcements." },
      { q: "How often should a Discord book club meet?", a: "Most successful Discord book clubs read one book per month. This gives everyone time to finish without rushing, and monthly rhythm keeps momentum going." },
    ],
  },
];

export function getTemplate(slug: string): ServerTemplate | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
