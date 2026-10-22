import { PermissionFlagsBits, GuildScheduledEventStatus, GuildNSFWLevel } from "discord.js";

/**
 * Everything Beacon reads from Discord, in one place. All of it is available
 * with the non-privileged `Guilds` + `GuildScheduledEvents` intents.
 */

export function guildVisuals(guild) {
  return {
    name: guild.name,
    iconUrl: guild.iconURL({ size: 256, extension: "png" }) ?? null,
    bannerUrl: guild.bannerURL({ size: 1024 }) ?? guild.splashURL({ size: 1024 }) ?? null,
    nsfw:
      guild.nsfwLevel === GuildNSFWLevel.Explicit || guild.nsfwLevel === GuildNSFWLevel.AgeRestricted,
  };
}

/** Approximate member + online counts via REST (`with_counts`), with a cache fallback. */
export async function fetchCounts(client, guildId) {
  try {
    const g = await client.guilds.fetch({ guild: guildId, withCounts: true, force: true });
    return {
      members: g.approximateMemberCount ?? g.memberCount ?? 0,
      online: g.approximatePresenceCount ?? 0,
    };
  } catch (err) {
    const cached = client.guilds.cache.get(guildId);
    if (!cached) throw err;
    return { members: cached.memberCount ?? 0, online: 0 };
  }
}

/** Scheduled events starting within `days` days (plus any currently active). */
export async function fetchUpcomingEvents(guild, days = 14) {
  const events = await guild.scheduledEvents.fetch().catch(() => null);
  if (!events) return [];
  const now = Date.now();
  const horizon = now + days * 86_400_000;
  return [...events.values()]
    .filter((e) => {
      const start = e.scheduledStartTimestamp ?? 0;
      const live = e.status === GuildScheduledEventStatus.Active;
      const soon = e.status === GuildScheduledEventStatus.Scheduled && start >= now - 3_600_000 && start <= horizon;
      return live || soon;
    })
    .sort((a, b) => (a.scheduledStartTimestamp ?? 0) - (b.scheduledStartTimestamp ?? 0))
    .map((e) => ({
      id: e.id,
      name: e.name,
      startsAt: e.scheduledStartTimestamp ? new Date(e.scheduledStartTimestamp).toISOString() : null,
      live: e.status === GuildScheduledEventStatus.Active,
      url: e.url,
    }));
}

export function canCreateInvite(channel, me) {
  return !!channel?.permissionsFor?.(me)?.has(PermissionFlagsBits.CreateInstantInvite);
}

export async function createPermanentInvite(channel, reason = "Beacon public page invite") {
  const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: true, reason });
  return invite.code;
}

/**
 * Does an invite still exist? Returns true/false, or null when Discord couldn't
 * be reached (so callers don't churn invites during an outage).
 */
export async function inviteExists(client, code) {
  try {
    await client.fetchInvite(code);
    return true;
  } catch (err) {
    if (err?.code === 10006) return false; // Unknown Invite
    return null;
  }
}

/**
 * Make sure the stored invite is valid; recreate it in the stored channel if it
 * was revoked. Returns the (possibly updated) row, or the row with a null
 * invite_code when the channel is gone or the bot lost permission.
 */
export async function ensureInvite(client, store, row) {
  if (row.invite_code) {
    const exists = await inviteExists(client, row.invite_code);
    if (exists !== false) return row;
  }
  const guild = client.guilds.cache.get(row.guild_id);
  const channel = row.invite_channel_id
    ? await guild?.channels.fetch(row.invite_channel_id).catch(() => null)
    : null;
  if (!guild || !channel || !canCreateInvite(channel, guild.members.me)) {
    return store.updateGuild(row.guild_id, { invite_code: null });
  }
  try {
    const code = await createPermanentInvite(channel, "Beacon invite was revoked — recreating");
    console.log(`[INVITE] Recreated invite for ${guild.name} (${guild.id})`);
    return store.updateGuild(row.guild_id, { invite_code: code });
  } catch (err) {
    console.warn(`[INVITE] Could not recreate invite for ${guild.id}: ${err.message}`);
    return store.updateGuild(row.guild_id, { invite_code: null });
  }
}

export function hasManageGuild(guild) {
  return !!guild?.members?.me?.permissions?.has(PermissionFlagsBits.ManageGuild);
}

/** Total uses of the stored invite — only readable with Manage Server. */
export async function fetchInviteUses(guild, code) {
  if (!code || !hasManageGuild(guild)) return null;
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return null;
  return invites.get(code)?.uses ?? null;
}
