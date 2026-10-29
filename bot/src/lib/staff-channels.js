/**
 * Staff-channel detection for Forget.
 *
 * Finding "the staff channel" reliably matters more than it looks: name matching
 * alone gives false positives (#staff-applications is public), and permission
 * analysis alone misses private channels that aren't staff-related (#vip).
 * So we score both signals and only trust a confident winner.
 */

import { ChannelType, PermissionFlagsBits } from "discord.js";

/** Name fragments that suggest a staff space, weighted by how specific they are. */
const NAME_HINTS = [
  [/\bstaff[-_ ]?chat\b/i, 10],
  [/\bmod[-_ ]?(chat|log|only)\b/i, 10],
  [/\badmin[-_ ]?(chat|log|only)\b/i, 10],
  [/\bstaff\b/i, 6],
  [/\bmods?\b/i, 5],
  [/\badmins?\b/i, 5],
  [/\bmoderat/i, 5],
  [/\bteam\b/i, 3],
  [/\blogs?\b/i, 3],
  [/\baudit\b/i, 3],
  [/\bback[-_ ]?room\b/i, 3],
];

/** Names that look staffy but are usually public — push these back down. */
const NAME_PENALTIES = [
  [/\bappl(y|ication)/i, -8],
  [/\brecruit/i, -8],
  [/\bsupport\b/i, -4],
  [/\bticket/i, -4],
  [/\bannounce/i, -6],
  [/\brules?\b/i, -6],
];

/** True when @everyone cannot view the channel — the strongest staff signal. */
export function isPrivate(channel) {
  const everyone = channel.guild.roles.everyone;
  const overwrite = channel.permissionOverwrites?.cache.get(everyone.id);
  return !!overwrite?.deny.has(PermissionFlagsBits.ViewChannel);
}

/** True when the channel is granted to a role that can moderate. */
function grantedToModRole(channel) {
  const overwrites = channel.permissionOverwrites?.cache ?? new Map();
  for (const ow of overwrites.values()) {
    if (!ow.allow.has(PermissionFlagsBits.ViewChannel)) continue;
    const role = channel.guild.roles.cache.get(ow.id);
    if (!role) continue;
    if (
      role.permissions.has(PermissionFlagsBits.ManageMessages) ||
      role.permissions.has(PermissionFlagsBits.KickMembers) ||
      role.permissions.has(PermissionFlagsBits.BanMembers) ||
      role.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return true;
    }
  }
  return false;
}

function scoreChannel(channel) {
  const haystack = `${channel.name} ${channel.parent?.name ?? ""}`;
  let score = 0;
  const reasons = [];

  for (const [re, pts] of NAME_HINTS) {
    if (re.test(haystack)) {
      score += pts;
      reasons.push(`name matches ${re.source}`);
      break; // strongest hint only — don't stack "staff" + "mods"
    }
  }
  for (const [re, pts] of NAME_PENALTIES) {
    if (re.test(haystack)) {
      score += pts;
      reasons.push(`looks public (${re.source})`);
    }
  }
  if (isPrivate(channel)) {
    score += 7;
    reasons.push("hidden from @everyone");
  }
  if (grantedToModRole(channel)) {
    score += 6;
    reasons.push("granted to a moderator role");
  }

  return { channel, score, reasons };
}

/** Channels Forget can actually post into. */
function postable(channel, me) {
  if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
    return false;
  }
  const perms = channel.permissionsFor(me);
  return !!perms?.has(PermissionFlagsBits.ViewChannel) && !!perms?.has(PermissionFlagsBits.SendMessages);
}

/**
 * Rank every postable channel by how staff-like it is.
 * Returns [{ channel, score, reasons }] sorted best-first (score > 0 only).
 */
export function rankStaffChannels(guild) {
  const me = guild.members.me;
  if (!me) return [];
  return guild.channels.cache
    .filter((c) => postable(c, me))
    .map(scoreChannel)
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Best staff channel, or null when nothing scores confidently.
 * The threshold keeps us from posting staff-only content somewhere public.
 */
export function findStaffChannel(guild, { minScore = 8 } = {}) {
  const [best] = rankStaffChannels(guild);
  return best && best.score >= minScore ? best : null;
}

/** A public channel to fall back to (system channel, then #general-ish). */
export function findPublicChannel(guild) {
  const me = guild.members.me;
  if (!me) return null;
  if (guild.systemChannel && postable(guild.systemChannel, me)) return guild.systemChannel;
  return (
    guild.channels.cache
      .filter((c) => postable(c, me) && !isPrivate(c))
      .sort((a, b) => a.rawPosition - b.rawPosition)
      .first() ?? null
  );
}
