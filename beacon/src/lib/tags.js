/**
 * The fixed tag taxonomy. Keeping it closed (no free-form tags) is what makes
 * the directory browsable — every tag page has enough servers to be worth
 * visiting, and nobody can game ranking with keyword stuffing.
 */

export const TAGS = [
  "gaming", "esports", "roleplay", "minecraft", "valorant", "fortnite", "roblox",
  "trading", "crypto", "business", "startups", "tech", "programming", "design", "art",
  "writing", "music", "anime", "memes", "movies", "sports", "fitness", "science",
  "education", "study", "language-learning", "community", "support", "lgbtq", "events",
];

export const TAG_LABELS = {
  "language-learning": "Language learning",
  lgbtq: "LGBTQ+",
  esports: "Esports",
  roleplay: "Roleplay",
};

export const MAX_TAGS = 5;
export const MIN_TAGS = 1;

const TAG_SET = new Set(TAGS);

export function tagLabel(tag) {
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export function isValidTag(tag) {
  return TAG_SET.has(tag);
}

/** Normalise + validate a tag list. Returns `{ ok, tags }` or `{ ok: false, error }`. */
export function validateTags(input) {
  const list = Array.isArray(input) ? input : [];
  const tags = [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
  const bad = tags.filter((t) => !isValidTag(t));
  if (bad.length) return { ok: false, error: `Unknown tag${bad.length > 1 ? "s" : ""}: ${bad.join(", ")}` };
  if (tags.length < MIN_TAGS) return { ok: false, error: "Pick at least one tag." };
  if (tags.length > MAX_TAGS) return { ok: false, error: `Pick at most ${MAX_TAGS} tags.` };
  return { ok: true, tags };
}

/**
 * Keyword hints → tag. Checked against the guild name, description, and channel
 * names, so suggestions come from data the bot already has — no AI involved.
 */
const HINTS = [
  ["gaming", ["game", "games", "gaming", "gamer", "lfg", "squad", "clan", "guild"]],
  ["esports", ["esport", "esports", "scrim", "tournament", "tourney", "competitive", "ranked", "bgmi", "pubg", "cs2", "csgo", "league"]],
  ["roleplay", ["roleplay", "rp", "darkrp", "character", "lore", "ooc", "ic"]],
  ["minecraft", ["minecraft", "mc", "smp", "survival", "creative"]],
  ["valorant", ["valorant", "val", "agents"]],
  ["fortnite", ["fortnite", "fn", "battle royale"]],
  ["roblox", ["roblox", "rblx"]],
  ["trading", ["trading", "trader", "stocks", "stock", "forex", "options", "futures", "charts", "ta", "market", "markets"]],
  ["crypto", ["crypto", "bitcoin", "btc", "eth", "ethereum", "defi", "nft", "web3", "solana", "token", "holder"]],
  ["business", ["business", "entrepreneur", "ecommerce", "marketing", "sales", "agency", "finance"]],
  ["startups", ["startup", "startups", "founder", "founders", "saas", "indie", "builders"]],
  ["tech", ["tech", "technology", "software", "hardware", "ai", "linux", "gadgets"]],
  ["programming", ["programming", "coding", "code", "dev", "developer", "developers", "javascript", "python", "rust", "typescript", "react", "open source"]],
  ["design", ["design", "designer", "ui", "ux", "figma", "graphic"]],
  ["art", ["art", "artist", "artists", "drawing", "illustration", "painting", "sketch", "commissions"]],
  ["writing", ["writing", "writer", "writers", "fiction", "poetry", "novel", "stories", "worldbuilding"]],
  ["music", ["music", "producer", "producers", "beats", "band", "dj", "spotify", "songs"]],
  ["anime", ["anime", "manga", "otaku", "weeb", "waifu"]],
  ["memes", ["meme", "memes", "shitpost", "funny"]],
  ["movies", ["movie", "movies", "film", "films", "cinema", "tv", "series", "netflix"]],
  ["sports", ["sports", "football", "soccer", "basketball", "nba", "nfl", "f1", "cricket", "tennis"]],
  ["fitness", ["fitness", "gym", "workout", "lifting", "running", "health", "nutrition"]],
  ["science", ["science", "physics", "chemistry", "biology", "space", "astronomy", "math", "maths"]],
  ["education", ["education", "school", "university", "uni", "college", "teacher", "course", "learn", "learning", "academy", "tutoring"]],
  ["study", ["study", "studying", "homework", "exam", "exams", "pomodoro", "focus"]],
  ["language-learning", ["language", "languages", "english", "spanish", "japanese", "korean", "french", "german", "learn english", "polyglot"]],
  ["community", ["community", "friends", "chill", "hangout", "social", "lounge", "chat", "vibe", "vibes"]],
  ["support", ["support", "help", "mental health", "advice", "wellbeing", "vent"]],
  ["lgbtq", ["lgbt", "lgbtq", "queer", "pride", "trans"]],
  ["events", ["event", "events", "meetup", "meetups", "workshop", "conference", "hackathon", "giveaway", "giveaways"]],
];

function tokenize(text) {
  const tokens = String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9+#\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
  // Also try naive singulars so "scrims" finds the "scrim" hint.
  const singular = tokens.filter((t) => t.length > 3 && t.endsWith("s")).map((t) => t.slice(0, -1));
  return [...tokens, ...singular];
}

/**
 * Suggest up to `limit` tags from free text sources. Name matches weigh more
 * than channel names, which weigh more than the description.
 */
export function suggestTags({ name = "", description = "", channels = [] } = {}, limit = MAX_TAGS) {
  const sources = [
    [tokenize(name), 3],
    [tokenize(channels.join(" ")), 2],
    [tokenize(description), 1],
  ];
  const scores = new Map();
  for (const [tag, hints] of HINTS) {
    let score = 0;
    for (const [tokens, weight] of sources) {
      const set = new Set(tokens);
      const joined = tokens.join(" ");
      for (const hint of hints) {
        if (hint.includes(" ") ? joined.includes(hint) : set.has(hint)) score += weight;
      }
    }
    if (score > 0) scores.set(tag, score);
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || TAGS.indexOf(a[0]) - TAGS.indexOf(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}
