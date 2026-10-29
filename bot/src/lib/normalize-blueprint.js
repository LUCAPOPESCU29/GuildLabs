/**
 * Blueprint normalizer.
 *
 * GuildLabs blueprints come from several sources, each with a slightly
 * different shape:
 *
 *   • Wizard export (`toJSON`)      → { server:{name}, categories:[{name,channels:[{name,type}]}],
 *                                       roles:[{name,color,hoist,permissions:"<human text>"}] }
 *   • Template export (current)     → { name, meta:{name}, categories:[…], channels:[…], roles:[…] }
 *   • Template export (older/live)  → { meta:{name}, channels:[{name,type,purpose}],
 *                                       roles:[{name,color,hoist,purpose}] }   ← no categories
 *   • API body / nested             → { blueprint:{…} } or { data:{…} }
 *
 * Rather than demand one rigid format, we accept all of them and emit a single
 * canonical shape the deployer understands:
 *
 *   { name, categories:[{ name, channels:[{ name, type, topic, permissions }] }],
 *     roles:[{ name, color, hoist, mentionable, permissions:[…flagNames], position }] }
 *
 * normalizeBlueprint(raw) → { blueprint, warnings } on success
 *                         → { error: { title, detail } } when nothing is usable
 */

const VALID_CHANNEL_TYPES = new Set(["text", "voice", "forum", "stage", "announcement"]);

/** Return the first argument that is an array (empty arrays count). */
function firstArray(...candidates) {
  for (const c of candidates) if (Array.isArray(c)) return c;
  return null;
}

/** Best-effort server name across every known shape. */
function pickName(src) {
  const candidates = [
    src.name,
    src.serverName,
    src.server?.name,
    src.meta?.name,
    src.guild?.name,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim().slice(0, 100);
  }
  return "Your server";
}

/** Strip an emoji/section prefix like "📋│rules" → "rules". */
function stripPrefix(name) {
  const idx = name.indexOf("│");
  return (idx >= 0 ? name.slice(idx + 1) : name).trim();
}

/** Map an arbitrary type value (+ name hint) to a canonical channel type. */
function normalizeChannelType(type, name = "") {
  if (typeof type === "string") {
    const t = type.toLowerCase().trim();
    if (t === "voice" || t === "guild_voice") return "voice";
    if (t === "stage" || t === "stage_voice" || t === "guild_stage_voice") return "stage";
    if (t === "forum" || t === "guild_forum") return "forum";
    if (t === "news" || t === "announcement" || t === "guild_announcement") return "announcement";
    if (VALID_CHANNEL_TYPES.has(t)) return t;
  }
  // Infer from the name when the type is missing or unknown.
  const lower = String(name).toLowerCase();
  if (/\b(vc|voice|lounge|lobby|talk|chat-?room)\b/.test(lower)) return "voice";
  if (lower.includes("stage")) return "stage";
  if (lower.includes("forum") || lower.includes("questions")) return "forum";
  return "text";
}

/** Keep only the first grapheme, and only if it's actually pictographic. */
function sanitizeEmoji(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  let first = raw;
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const it = seg.segment(raw)[Symbol.iterator]().next();
    if (!it.done) first = it.value.segment;
  } catch {
    first = Array.from(raw)[0] ?? "";
  }
  return /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(first) ? first : "";
}

/**
 * Prepend the emoji AFTER the label has been sanitised.
 *
 * Order matters: `sanitizeChannelName` strips every non-alphanumeric character,
 * so composing first would delete the emoji. Text channels get a middle dot
 * (Discord preserves it); voice channels keep a plain space.
 */
function composeChannelName(label, emoji, type) {
  if (!emoji) return label;
  const sep = type === "voice" || type === "stage" ? " " : "・";
  return `${emoji}${sep}${label}`.slice(0, 100);
}

/** Produce a Discord-valid channel name for the given type. */
function sanitizeChannelName(rawName, type) {
  let name = stripPrefix(String(rawName ?? "").trim());
  if (!name) return type === "voice" || type === "stage" ? "Voice" : "channel";

  if (type === "voice" || type === "stage") {
    // Voice/stage names may keep spaces and capitalisation.
    return name.slice(0, 100);
  }
  // Text/forum/announcement: Discord lowercases and hyphenates anyway —
  // do it ourselves so the name is predictable and never rejected.
  name = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return (name || "channel").slice(0, 100);
}

function normalizeChannels(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((ch) => {
      if (!ch) return null;
      const rawName = ch.name ?? ch.title ?? ch.label;
      if (rawName == null || String(rawName).trim() === "") return null;
      const type = normalizeChannelType(ch.type, rawName);
      const isVoice = type === "voice" || type === "stage";
      const label = sanitizeChannelName(rawName, type);
      const emoji = sanitizeEmoji(ch.emoji);
      const clamp = (v, max) => {
        const n = Math.floor(Number(v));
        return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
      };
      return {
        name: composeChannelName(label, emoji, type),
        type,
        topic: isVoice ? null : (ch.topic ?? ch.purpose ?? ch.description ?? null),
        // Discord rejects these on the wrong channel kind — send only what applies.
        slowmode: isVoice ? 0 : clamp(ch.slowmode, 21600),
        nsfw: !isVoice && ch.nsfw === true,
        userLimit: isVoice ? clamp(ch.userLimit, 99) : 0,
        permissions: Array.isArray(ch.permissions) ? ch.permissions : [],
      };
    })
    .filter(Boolean);
}

/** Baseline a member role needs to actually participate. Free-text roles get
 *  this floor so they're never created powerless. */
const MEMBER_BASELINE = [
  "ViewChannel",
  "SendMessages",
  "ReadMessageHistory",
  "AddReactions",
  "SendMessagesInThreads",
  "UseApplicationCommands",
  "Connect",
  "Speak",
];

/** Phrases (from the wizard's free-text perms) → Discord permission flags. */
const PERMISSION_KEYWORDS = [
  [/manage.*(server|guild)/, ["ManageGuild"]],
  [/manage.*channel/, ["ManageChannels"]],
  [/manage.*role/, ["ManageRoles"]],
  [/manage.*(message|support|class|ticket)/, ["ManageMessages", "ManageThreads"]],
  [/\bkick\b/, ["KickMembers"]],
  [/\bban\b/, ["BanMembers"]],
  [/\b(mute|timeout|moderat)/, ["ModerateMembers", "MuteMembers"]],
  [/mention.*every|every.*mention/, ["MentionEveryone"]],
  [/\b(embed|link)/, ["EmbedLinks"]],
  [/\b(attach|file|upload|image|media)/, ["AttachFiles"]],
  [/\b(react|emoji)/, ["AddReactions", "UseExternalEmojis"]],
  [/\b(stream|video|screen)/, ["Stream"]],
  [/\bthread/, ["CreatePublicThreads"]],
];

/** Coerce a role's permissions (array of flag names OR free text) → flag names.
 *  Empty / unresolvable input falls back to the member baseline so deployed
 *  roles are always functional. */
function normalizePerms(perms) {
  if (Array.isArray(perms)) {
    const flags = perms.filter((p) => typeof p === "string" && p.trim());
    return flags.length ? flags : [...MEMBER_BASELINE];
  }
  if (typeof perms === "string" && perms.trim()) {
    const text = perms.toLowerCase();
    if (/\badmin/.test(text)) return ["Administrator"];
    if (/view.*only|read.*only/.test(text)) return ["ViewChannel", "ReadMessageHistory"];
    const flags = new Set(MEMBER_BASELINE);
    for (const [re, names] of PERMISSION_KEYWORDS) {
      if (re.test(text)) names.forEach((n) => flags.add(n));
    }
    return [...flags];
  }
  return [...MEMBER_BASELINE];
}

/** Normalise a color into something discord.js accepts, or null. */
function normalizeColor(color) {
  if (typeof color === "number" && Number.isFinite(color)) return color;
  if (typeof color === "string") {
    const c = color.trim();
    if (/^#?[0-9a-f]{6}$/i.test(c)) return c.startsWith("#") ? c : `#${c}`;
  }
  return null;
}

function normalizeRoles(src) {
  const arr = firstArray(src.roles, src.server?.roles);
  if (!arr) return [];
  const filtered = arr.filter((r) => {
    const name = (r?.name ?? "").toString().trim();
    return name && name !== "@everyone";
  });
  return filtered.map((r, i) => ({
    name: String(r.name).trim().slice(0, 100),
    color: normalizeColor(r.color),
    hoist: Boolean(r.hoist),
    mentionable: Boolean(r.mentionable),
    permissions: normalizePerms(r.permissions ?? r.perms),
    // First role listed sits highest in the hierarchy.
    position: filtered.length - i,
  }));
}

function normalizeCategories(src, name, warnings) {
  // 1. Already grouped into categories.
  const explicit = firstArray(src.categories, src.server?.categories);
  if (explicit && explicit.length) {
    const cats = explicit
      .map((c) => {
        if (!c) return null;
        const channels = normalizeChannels(c.channels ?? c.items ?? []);
        if (!channels.length) return null;
        const catLabel = stripPrefix(String(c.name ?? "General").trim()) || "General";
        const catEmoji = sanitizeEmoji(c.emoji);
        return {
          name: (catEmoji ? `${catEmoji}・${catLabel}` : catLabel).slice(0, 100),
          channels,
        };
      })
      .filter(Boolean);
    if (cats.length) return cats;
  }

  // 2. Flat channel list → group into Text / Voice categories.
  const flat = firstArray(src.channels, src.server?.channels);
  if (flat && flat.length) {
    const channels = normalizeChannels(flat);
    if (channels.length) {
      const voiceTypes = new Set(["voice", "stage"]);
      const text = channels.filter((c) => !voiceTypes.has(c.type));
      const voice = channels.filter((c) => voiceTypes.has(c.type));
      const cats = [];
      if (text.length) cats.push({ name, channels: text });
      if (voice.length) cats.push({ name: "Voice", channels: voice });
      warnings.push(
        `Grouped ${channels.length} loose channel${channels.length === 1 ? "" : "s"} into ${cats.length} categor${cats.length === 1 ? "y" : "ies"}.`
      );
      return cats;
    }
  }

  return [];
}

/**
 * @param {unknown} raw Parsed JSON from the uploaded file or API body.
 * @returns {{ blueprint: object, warnings: string[] } | { error: { title: string, detail: string } }}
 */
export function normalizeBlueprint(raw) {
  // Unwrap common envelopes: { blueprint }, { data }, { result }.
  const src = raw?.blueprint ?? raw?.data ?? raw?.result ?? raw;

  if (!src || typeof src !== "object" || Array.isArray(src)) {
    return {
      error: {
        title: "Empty or unreadable blueprint",
        detail:
          "The file didn't contain a blueprint object. Re-export your server from the " +
          "GuildLabs builder and upload that `.json` file.",
      },
    };
  }

  const warnings = [];
  const name = pickName(src);
  const roles = normalizeRoles(src);
  const categories = normalizeCategories(src, name, warnings);

  if (!categories.length && !roles.length) {
    const keys = Object.keys(src).slice(0, 12);
    return {
      error: {
        title: "Couldn't find anything to build",
        detail:
          "I read the file, but found no channels or roles to create.\n\n" +
          (keys.length
            ? `**Keys I found:** ${keys.map((k) => `\`${k}\``).join(", ")}\n\n`
            : "") +
          "A blueprint needs a `categories` array (each with `channels`) **or** a flat " +
          "`channels` array, plus a `roles` array. Re-export a fresh file from the " +
          "GuildLabs builder — the file may be from another tool or truncated.",
      },
    };
  }

  const channelCount = categories.reduce((n, c) => n + c.channels.length, 0);

  return {
    blueprint: { name, categories, roles },
    warnings,
    stats: { categories: categories.length, channels: channelCount, roles: roles.length },
  };
}
