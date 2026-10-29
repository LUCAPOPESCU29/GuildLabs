/* The "AI" core: turns wizard selections into a deployable server blueprint.
   It suggests smart defaults per type, merges multiple types, and emits JSON. */

export type ChannelKind = "text" | "voice" | "stage" | "forum" | "announcement";

/** Longest slowmode Discord accepts, in seconds (6 hours). */
export const MAX_SLOWMODE = 21_600;
/** Discord's cap on a voice channel's user limit (0 = unlimited). */
export const MAX_USER_LIMIT = 99;
export const MAX_TOPIC = 1024;

export type Channel = {
  name: string;
  type: ChannelKind;
  /** Rendered into the channel name at deploy time, e.g. 💬・general */
  emoji?: string;
  /** Channel topic / description. Text-like channels only. */
  topic?: string;
  /** Slowmode in seconds, 0–21600. Text-like channels only. */
  slowmode?: number;
  /** Age-restricted. Text-like channels only. */
  nsfw?: boolean;
  /** Voice/stage only. 0 = unlimited. */
  userLimit?: number;
};

export type Category = { name: string; emoji: string; channels: Channel[] };

export type Role = {
  name: string;
  color: string;
  hoist: boolean;
  perms: string;
  /** Whether @mentioning the role is allowed. */
  mentionable?: boolean;
};

/** Sensible per-type emoji, used when the model omits one. */
export const DEFAULT_CHANNEL_EMOJI: Record<ChannelKind, string> = {
  text: "💬",
  voice: "🔊",
  stage: "🎙",
  forum: "🧵",
  announcement: "📢",
};

/**
 * Coerce arbitrary input down to exactly one emoji.
 *
 * Models happily return "🎮 gaming", ":video_game:", "" or three emoji in a row.
 * We take the first grapheme cluster (so multi-codepoint emoji like 👨‍👩‍👧 or 🇬🇧
 * survive intact) and keep it only if it's actually pictographic — otherwise the
 * fallback wins, which is why a channel never ends up with a stray letter as its
 * "emoji".
 */
export function sanitizeEmoji(input: unknown, fallback = ""): string {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return fallback;

  let first = raw;
  // Intl.Segmenter keeps ZWJ sequences and flags together; older runtimes fall
  // back to Array.from, which at least splits on code points rather than units.
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const it = seg.segment(raw)[Symbol.iterator]().next();
    if (!it.done) first = it.value.segment;
  } catch {
    first = Array.from(raw)[0] ?? "";
  }

  return /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(first) ? first : fallback;
}

/** Channel kinds that accept a topic, slowmode and the NSFW flag. */
export const TEXT_LIKE: ChannelKind[] = ["text", "forum", "announcement"];
export const VOICE_LIKE: ChannelKind[] = ["voice", "stage"];

/**
 * Compose the deployable channel name. The emoji lives in its own field so the
 * editor and AI can reason about the label alone; only here do they combine.
 * Text channels get a middle dot (Discord keeps it and it reads cleanly once
 * spaces are normalised to dashes); voice channels keep a plain space.
 */
export function channelDisplayName(ch: Channel): string {
  const label = (ch.name ?? "").trim();
  const emoji = (ch.emoji ?? "").trim();
  if (!emoji) return label;
  return VOICE_LIKE.includes(ch.type) ? `${emoji} ${label}` : `${emoji}・${label}`;
}

/* Permission presets — map a friendly preset to a Discord-realistic perm summary.
   Centralized here so the wizard selector, blueprint, preview and JSON all agree. */
export type PermPreset = "admin" | "mod" | "trusted" | "member" | "view";

export const PERM_PRESETS: Record<PermPreset, string> = {
  admin: "Administrator",
  mod: "Manage messages, kick, mute",
  trusted: "Embed links, attach files, add reactions",
  member: "Send messages, connect",
  view: "View channels only",
};

/* Exact Discord permission flags (discord.js PermissionFlagsBits names) per
   preset. These are what actually gets sent to the deploy API — the human
   strings above are display-only. Keep every name a valid discord.js v14 flag. */
const MEMBER_FLAGS = [
  "ViewChannel",
  "SendMessages",
  "ReadMessageHistory",
  "AddReactions",
  "SendMessagesInThreads",
  "UseApplicationCommands",
  "Connect",
  "Speak",
];

export const PERM_FLAGS: Record<PermPreset, string[]> = {
  admin: ["Administrator"],
  mod: [
    ...MEMBER_FLAGS,
    "ManageMessages",
    "ManageThreads",
    "KickMembers",
    "BanMembers",
    "ModerateMembers",
    "MuteMembers",
    "DeafenMembers",
    "MoveMembers",
    "ManageNicknames",
    "EmbedLinks",
    "AttachFiles",
  ],
  trusted: [
    ...MEMBER_FLAGS,
    "EmbedLinks",
    "AttachFiles",
    "UseExternalEmojis",
    "CreatePublicThreads",
    "Stream",
  ],
  member: MEMBER_FLAGS,
  view: ["ViewChannel", "ReadMessageHistory"],
};

/* Keyword fallbacks for free-text perms (custom roles like
   "Manage class channels" or "Team A voice + chat"). Added ON TOP of the
   member baseline so a custom role is never created powerless. */
const PERM_KEYWORD_FLAGS: [RegExp, string[]][] = [
  [/manage.*(server|guild)/i, ["ManageGuild"]],
  [/manage.*channel/i, ["ManageChannels"]],
  [/manage.*role/i, ["ManageRoles"]],
  [/manage.*(message|support|class|ticket)/i, ["ManageMessages", "ManageThreads"]],
  [/\bkick\b/i, ["KickMembers"]],
  [/\bban\b/i, ["BanMembers"]],
  [/\b(mute|timeout|moderat)/i, ["ModerateMembers", "MuteMembers"]],
  [/\b(embed|link)/i, ["EmbedLinks"]],
  [/\b(attach|file|upload|image|media)/i, ["AttachFiles"]],
  [/\b(react|emoji)/i, ["AddReactions", "UseExternalEmojis"]],
  [/\b(stream|video|screen)/i, ["Stream"]],
  [/\bthread/i, ["CreatePublicThreads"]],
  [/mention.*every/i, ["MentionEveryone"]],
];

/** Resolve a role's perms (preset key, preset string, or free text) into
 *  explicit Discord permission flag names. Never returns an empty list. */
export function permsToFlags(perms: string): string[] {
  const text = (perms ?? "").trim();
  // Preset key ("mod") or preset display string ("Manage messages, kick, mute").
  if (text in PERM_FLAGS) return PERM_FLAGS[text as PermPreset];
  for (const key of Object.keys(PERM_PRESETS) as PermPreset[]) {
    if (PERM_PRESETS[key].toLowerCase() === text.toLowerCase()) return PERM_FLAGS[key];
  }
  if (/\badmin/i.test(text)) return PERM_FLAGS.admin;
  if (/view.*only|read.*only/i.test(text)) return PERM_FLAGS.view;
  // Free text → member baseline + any keyword matches.
  const flags = new Set(MEMBER_FLAGS);
  for (const [re, names] of PERM_KEYWORD_FLAGS) {
    if (re.test(text)) names.forEach((n) => flags.add(n));
  }
  return [...flags];
}

/* Short labels for the segmented selector in the wizard. */
export const PERM_PRESET_LABELS: Record<PermPreset, string> = {
  admin: "Admin",
  mod: "Mod",
  trusted: "Trusted",
  member: "Member",
  view: "View only",
};

export const PERM_PRESET_ORDER: PermPreset[] = [
  "admin",
  "mod",
  "trusted",
  "member",
  "view",
];

/* Rotating palette used to auto-pick a fresh color for each new custom role. */
export const ROLE_PALETTE: string[] = [
  "#f43f5e",
  "#fb923c",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#38bdf8",
  "#6366f1",
  "#a78bfa",
  "#ec4899",
  "#94a3b8",
];

/* A fully-customizable role authored in the wizard's Roles step. */
export type CustomRole = {
  id: string;
  name: string;
  color: string;
  hoist: boolean;
  perms: PermPreset;
};

export type WizardState = {
  serverName: string;
  types: string[];
  moderation: string;
  features: string[];
  channels: string[];
  rolePacks: string[];
  customRoles: CustomRole[];
  advanced: string[];
};

export type Blueprint = {
  name: string;
  summary: string;
  mixNote: string;
  categories: Category[];
  roles: Role[];
  permissions: string[];
  stats: { categories: number; channels: number; voice: number; roles: number };
};

export const initialState: WizardState = {
  serverName: "",
  types: [],
  moderation: "balanced",
  features: ["voice"],
  channels: ["INFO", "CHAT", "VOICE"],
  rolePacks: ["basic"],
  customRoles: [],
  advanced: ["welcome", "autorole"],
};

/**
 * Channel-name → emoji hints, most specific first.
 *
 * The wizard and the offline fallback build channels from fixed pools, so
 * deriving the emoji from the name keeps every path emoji-complete without
 * hand-annotating each entry — and keeps them consistent with what the model
 * picks for the same channel names.
 */
const NAME_EMOJI: [RegExp, string][] = [
  [/\bwelcome\b|\bintro(duction)?s?\b/, "👋"],
  [/\brules?\b/, "📌"],
  [/\bannounce\w*\b|\bnews\b/, "📢"],
  [/\bdisclaimers?\b|\blegal\b/, "⚖"],
  [/\bschedule\b|\bcalendar\b|\bevents?\b/, "📅"],
  [/\bstaff\b|\bmod-?logs?\b/, "🛡"],
  [/\blogs?\b|\baudit\b/, "📋"],
  [/\bhelp\b|\bsupport\b|\btickets?\b/, "🎫"],
  [/\bbugs?\b|\bissues?\b/, "🐛"],
  [/\bbot-?commands?\b|\bcommands?\b/, "🤖"],
  [/\bmemes?\b/, "😂"],
  [/\bclips?\b|\bhighlights?\b/, "🎬"],
  // "off-topic" contains "pic" — \b prevents that false match.
  [/\bpics?\b|\bphotos?\b|\bimages?\b|\bpets?\b|\bgallery\b/, "🖼"],
  [/\bmusic\b|\bnow-?playing\b|\bjam\b|\blistening\b/, "🎵"],
  [/\blfg\b|\bsquads?\b|\bteams?\b/, "🤝"],
  [/\bgames?\b|\bgaming\b/, "🎮"],
  [/\bstudy\b|\bhomework\b|\bclass\b|\bresources?\b|\bschool\b/, "📚"],
  [/\bshowcase\b|\bwip\b|\binspiration\b|\bcreative\b/, "🎨"],
  [/\bfeedback\b|\bsuggestions?\b|\bideas?\b/, "💡"],
  [/\bdev\b|\bcode\b|\btech\b/, "💻"],
  [/\bmarket\b|\bprices?\b|\balpha\b|\btrading\b/, "📈"],
  [/\balerts?\b/, "🔔"],
  [/\boff-?topic\b|\brandom\b/, "🎲"],
  [/\bgeneral\b|\bchat\b|\btalk\b/, "💬"],
];

/**
 * Voice channels get their own pass first. Without it "General VC" matches the
 * text rule for /general/ and ends up with a 💬 chat bubble on a voice channel.
 */
const VOICE_NAME_EMOJI: [RegExp, string][] = [
  [/\bstaff\b/, "🛡"],
  [/\bmusic\b|\bjam\b|\blistening\b|\bkaraoke\b/, "🎵"],
  [/\bstudy\b|\bfocus\b/, "📚"],
  [/\bsquads?\b|\bteams?\b|\bparty\b/, "🤝"],
  [/\bstage\b|\bpodcast\b|\bmic\b/, "🎙"],
  [/\bgames?\b|\bgaming\b/, "🎮"],
  [/\bafk\b/, "💤"],
];

/** Pick an emoji for a channel from its name, falling back to its type. */
export function channelEmojiFor(name: string, type: ChannelKind): string {
  const n = name.toLowerCase();
  const table = VOICE_LIKE.includes(type) ? VOICE_NAME_EMOJI : NAME_EMOJI;
  for (const [re, emoji] of table) if (re.test(n)) return emoji;
  return DEFAULT_CHANNEL_EMOJI[type];
}

const TEXT = (name: string): Channel => ({ name, type: "text", emoji: channelEmojiFor(name, "text") });
const VOICE = (name: string): Channel => ({ name, type: "voice", emoji: channelEmojiFor(name, "voice") });

/* Per-type smart channel defaults the "AI" injects into matching categories. */
const TYPE_CHANNELS: Record<string, Partial<Record<string, Channel[]>>> = {
  gaming: {
    CHAT: [TEXT("clips"), TEXT("lfg"), TEXT("game-chat")],
    VOICE: [VOICE("voice-lobby"), VOICE("squad-1"), VOICE("squad-2")],
    FUN: [TEXT("highlights"), TEXT("clip-of-the-week")],
  },
  school: {
    CHAT: [TEXT("homework-help"), TEXT("study-group"), TEXT("resources")],
    VOICE: [VOICE("study-room"), VOICE("focus-zone")],
    INFO: [TEXT("class-schedule")],
  },
  community: {
    CHAT: [TEXT("introductions"), TEXT("general"), TEXT("off-topic")],
    FUN: [TEXT("memes"), TEXT("pet-pics")],
  },
  crypto: {
    CHAT: [TEXT("market-chat"), TEXT("alpha"), TEXT("price-alerts")],
    INFO: [TEXT("disclaimers")],
  },
  music: {
    CHAT: [TEXT("now-playing"), TEXT("recommendations")],
    VOICE: [VOICE("listening-party"), VOICE("jam-room")],
  },
  tech: {
    CHAT: [TEXT("dev-talk"), TEXT("showcase"), TEXT("help-desk")],
    SUPPORT: [TEXT("bug-reports")],
  },
  creative: {
    CHAT: [TEXT("showcase"), TEXT("feedback"), TEXT("wip")],
    FUN: [TEXT("inspiration")],
  },
};

const BASE_CATEGORY: Record<string, { emoji: string; channels: Channel[] }> = {
  INFO: { emoji: "📢", channels: [TEXT("welcome"), TEXT("rules"), TEXT("announcements")] },
  CHAT: { emoji: "💬", channels: [TEXT("general")] },
  VOICE: { emoji: "🔊", channels: [VOICE("General VC")] },
  EVENTS: { emoji: "📅", channels: [TEXT("event-info"), { name: "Stage", type: "stage", emoji: channelEmojiFor("Stage", "stage") }] },
  SUPPORT: { emoji: "🛟", channels: [TEXT("get-help")] },
  FUN: { emoji: "🎮", channels: [TEXT("bot-commands")] },
  STAFF: { emoji: "🛡️", channels: [TEXT("staff-chat"), TEXT("mod-log"), VOICE("Staff VC")] },
};

const TYPE_LABEL: Record<string, string> = {
  gaming: "Gaming",
  school: "Study",
  community: "Community",
  crypto: "Crypto",
  music: "Music",
  tech: "Tech",
  creative: "Creative",
};

const PACK_ROLES: Record<string, Role[]> = {
  basic: [
    { name: "Admin", color: "#f43f5e", hoist: true, perms: "Administrator" },
    { name: "Moderator", color: "#5865f2", hoist: true, perms: "Manage messages, kick, mute" },
    { name: "Member", color: "#a78bfa", hoist: false, perms: "Send messages, connect" },
  ],
  gaming: [
    { name: "Gamer", color: "#22c55e", hoist: true, perms: "Access gaming channels" },
    { name: "Team A", color: "#38bdf8", hoist: false, perms: "Team A voice + chat" },
    { name: "Team B", color: "#fb923c", hoist: false, perms: "Team B voice + chat" },
  ],
  school: [
    { name: "Teacher", color: "#eab308", hoist: true, perms: "Manage class channels" },
    { name: "Student", color: "#8b5cf6", hoist: false, perms: "Access study channels" },
  ],
  business: [
    { name: "Owner", color: "#f43f5e", hoist: true, perms: "Administrator" },
    { name: "Staff", color: "#5865f2", hoist: true, perms: "Manage support" },
    { name: "Client", color: "#94a3b8", hoist: false, perms: "View + ticket" },
  ],
};

function dedupeChannels(channels: Channel[]): Channel[] {
  const seen = new Set<string>();
  return channels.filter((c) => {
    const k = `${c.type}:${c.name.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Build the merged channel tree from selected groups + type smart-defaults. */
function buildCategories(state: WizardState): Category[] {
  const groups = [...state.channels];

  // feature → channel-group implications (AI fills gaps).
  if (state.features.includes("events") && !groups.includes("EVENTS")) groups.push("EVENTS");
  if (state.features.includes("tickets") && !groups.includes("SUPPORT")) groups.push("SUPPORT");
  if (state.features.includes("voice") && !groups.includes("VOICE")) groups.push("VOICE");

  const order = ["INFO", "CHAT", "VOICE", "EVENTS", "SUPPORT", "FUN", "STAFF"];

  return order
    .filter((g) => groups.includes(g))
    .map((g) => {
      const base = BASE_CATEGORY[g];
      let channels = [...base.channels];
      for (const t of state.types) {
        const extra = TYPE_CHANNELS[t]?.[g];
        if (extra) channels = channels.concat(extra);
      }
      // economy adds a shop text channel to CHAT
      if (g === "CHAT" && state.features.includes("economy")) channels.push(TEXT("shop"));
      if (g === "CHAT" && state.features.includes("selfroles")) channels.push(TEXT("roles"));
      if (g === "INFO" && state.features.includes("leveling")) channels.push(TEXT("leaderboard"));
      return { name: g, emoji: base.emoji, channels: dedupeChannels(channels) };
    });
}

function buildRoles(state: WizardState): Role[] {
  const roles: Role[] = [];
  const seen = new Set<string>();
  for (const pack of state.rolePacks) {
    for (const r of PACK_ROLES[pack] ?? []) {
      if (seen.has(r.name)) continue;
      seen.add(r.name);
      roles.push(r);
    }
  }
  if (state.features.includes("leveling")) {
    roles.push({ name: "Level 10+", color: "#fbbf24", hoist: false, perms: "Earned via XP" });
  }
  for (const cr of state.customRoles) {
    const trimmed = cr.name.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      roles.push({
        name: trimmed,
        color: cr.color,
        hoist: cr.hoist,
        perms: PERM_PRESETS[cr.perms] ?? PERM_PRESETS.member,
      });
    }
  }
  if (roles.length === 0) {
    roles.push({ name: "Member", color: "#a78bfa", hoist: false, perms: "Send messages" });
  }
  return roles;
}

function buildPermissions(state: WizardState): string[] {
  const p: string[] = [];
  if (state.moderation === "strict")
    p.push("New members land in a verification gate before seeing channels.");
  if (state.moderation === "balanced")
    p.push("@everyone can chat in public channels; mods retain elevated tools.");
  if (state.moderation === "casual")
    p.push("Open access — most channels visible to everyone immediately.");
  if (state.channels.includes("STAFF"))
    p.push("Staff category locked to Admin/Moderator roles only.");
  if (state.advanced.includes("verification"))
    p.push("Verification role required to unlock chat & voice.");
  if (state.advanced.includes("antiraid"))
    p.push("Anti-raid: join-rate limits + new-account quarantine.");
  if (state.advanced.includes("aimod"))
    p.push("AI moderation scans messages for spam, slurs & links.");
  if (state.advanced.includes("autorole"))
    p.push("Auto-role assigns a base Member role on join.");
  if (state.advanced.includes("welcome"))
    p.push("Welcome message posts to #welcome with member count.");
  return p;
}

function buildMixNote(state: WizardState): string {
  const t = state.types;
  if (t.length === 0) return "Pick a server type and the AI will tailor the layout.";
  const labels = t.map((x) => TYPE_LABEL[x] ?? x);
  if (t.includes("gaming") && t.includes("community"))
    return "Gaming + Community → added #clips, #lfg and a voice-lobby so squads and socializing live side by side.";
  if (t.includes("gaming") && t.includes("school"))
    return "Mixed layout: separate study zones (#study-group, focus-room) and gaming zones (#lfg, squad VCs) keep work and play apart.";
  if (t.includes("crypto") && t.includes("community"))
    return "Crypto + Community → market channels paired with social spaces, plus a disclaimers channel for safety.";
  if (t.length === 1)
    return `${labels[0]} server — channels and roles tuned to a focused ${labels[0].toLowerCase()} setup.`;
  return `Blended ${labels.join(" + ")} server — overlapping channels merged and de-duplicated into one clean layout.`;
}

export function generateBlueprint(state: WizardState): Blueprint {
  const categories = buildCategories(state);
  const roles = buildRoles(state);
  const permissions = buildPermissions(state);
  const allChannels = categories.flatMap((c) => c.channels);
  const voice = allChannels.filter((c) => c.type === "voice" || c.type === "stage").length;
  const name = state.serverName.trim() || "My Server";

  const typeLabels = state.types.map((t) => TYPE_LABEL[t] ?? t);
  const summary =
    state.types.length > 0
      ? `A ${state.moderation} ${typeLabels.join(" / ")} server with ${categories.length} categories and ${roles.length} roles.`
      : `A ${state.moderation} server with ${categories.length} categories and ${roles.length} roles.`;

  return {
    name,
    summary,
    mixNote: buildMixNote(state),
    categories,
    roles,
    permissions,
    stats: {
      categories: categories.length,
      channels: allChannels.length,
      voice,
      roles: roles.length,
    },
  };
}

/** Final deployable JSON blueprint. */
export function toJSON(state: WizardState, bp: Blueprint) {
  return {
    server: {
      name: bp.name,
      types: state.types,
      moderation: state.moderation,
      features: state.features,
      advanced: state.advanced,
    },
    categories: bp.categories.map((c) => ({
      name: c.name,
      channels: c.channels.map((ch) => ({
        name: ch.name,
        type: ch.type,
        ...(ch.emoji ? { emoji: ch.emoji } : {}),
        ...(ch.topic ? { topic: ch.topic } : {}),
        ...(ch.slowmode ? { slowmode: ch.slowmode } : {}),
        ...(ch.nsfw ? { nsfw: true } : {}),
        ...(ch.userLimit ? { userLimit: ch.userLimit } : {}),
      })),
    })),
    roles: bp.roles.map((r) => ({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      // Explicit Discord flag names — the deployer applies these verbatim.
      permissions: permsToFlags(r.perms),
      // Human-readable summary, kept for display/debugging of exported JSON.
      permissionsLabel: r.perms,
    })),
    permissions: bp.permissions,
  };
}
