import {
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
} from "discord.js";

/**
 * Takes a Forge blueprint JSON and applies it to a live Discord guild.
 * Creates: categories → channels → roles → permission overwrites.
 * Returns a summary of what was created.
 */
export async function deployBlueprint(guild, blueprint) {
  const log = [];

  const roles = Array.isArray(blueprint.roles) ? blueprint.roles : [];
  const categories = Array.isArray(blueprint.categories) ? blueprint.categories : [];

  // ── 1. Create roles (skip @everyone) ─────────────────────────────────────
  const roleMap = new Map(); // name → Role

  const sortedRoles = [...roles].sort(
    (a, b) => (b.position ?? 0) - (a.position ?? 0)
  );

  for (const roleDef of sortedRoles) {
    if (roleDef.name === "@everyone") continue;

    // Skip if role with that name already exists
    const existing = guild.roles.cache.find(
      (r) => r.name.toLowerCase() === roleDef.name.toLowerCase()
    );
    if (existing) {
      roleMap.set(roleDef.name, existing);
      log.push(`⏭️  Role already exists: ${roleDef.name}`);
      continue;
    }

    const permissions = buildPermissions(roleDef.permissions || []);
    const role = await guild.roles.create({
      name: roleDef.name,
      color: roleDef.color || null,
      hoist: roleDef.hoist ?? false,
      mentionable: roleDef.mentionable ?? false,
      permissions,
      reason: "Forge blueprint deployment",
    });

    roleMap.set(roleDef.name, role);
    log.push(`✅ Created role: ${roleDef.name}`);
  }

  // ── 2. Create categories + channels ──────────────────────────────────────
  for (const category of categories) {
    // Create category
    const cat = await guild.channels.create({
      name: category.name,
      type: ChannelType.GuildCategory,
      reason: "Forge blueprint deployment",
    });
    log.push(`📁 Created category: ${category.name}`);

    // Create channels inside
    const channels = Array.isArray(category.channels) ? category.channels : [];
    for (const chDef of channels) {
      const type =
        chDef.type === "voice"
          ? ChannelType.GuildVoice
          : chDef.type === "stage"
          ? ChannelType.GuildStageVoice
          : chDef.type === "forum"
          ? ChannelType.GuildForum
          : chDef.type === "announcement"
          ? ChannelType.GuildAnnouncement
          : ChannelType.GuildText;

      const permissionOverwrites = buildOverwrites(
        chDef.permissions || [],
        guild,
        roleMap
      );

      const isVoice = type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice;
      // Forum and stage channels reject text-channel fields (topic, slowmode,
      // nsfw, userLimit) with a 400 that would abort the whole build partway
      // through — send only the fields each channel kind supports.
      const isRestricted = isVoice || type === ChannelType.GuildForum;
      let channel;
      try {
        channel = await guild.channels.create({
          name: chDef.name,
          type,
          parent: cat.id,
          permissionOverwrites,
          reason: "Forge blueprint deployment",
          ...(isRestricted
            ? {}
            : {
                topic: chDef.topic || null,
                ...(chDef.slowmode > 0
                  ? { rateLimitPerUser: Math.min(21600, chDef.slowmode) }
                  : {}),
                ...(chDef.nsfw === true ? { nsfw: true } : {}),
              }),
        });
      } catch (err) {
        log.push(`⚠️  Skipped #${chDef.name} (${chDef.type || "text"}): ${err.message}`);
        continue;
      }

      log.push(`  #${channel.name} (${chDef.type || "text"})`);
    }
  }

  // ── 3. Apply permission overwrites to guild ───────────────────────────────
  // (already handled per-channel above)

  return log;
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Convert string permission names → PermissionsBitField bigint.
 *  Tolerant of non-array / unknown input (returns undefined = no overrides). */
function buildPermissions(perms) {
  const list = Array.isArray(perms) ? perms : [];
  const bits = list
    .map((p) => PermissionFlagsBits[p])
    .filter(Boolean);
  return bits.length ? bits.reduce((a, b) => a | b, 0n) : undefined;
}

/** Build permission overwrite objects for a channel */
function buildOverwrites(overwrites, guild, roleMap) {
  return overwrites.map((ow) => {
    const target =
      ow.role === "@everyone"
        ? guild.roles.everyone
        : roleMap.get(ow.role);

    if (!target) return null;

    return {
      id: target.id,
      type: OverwriteType.Role,
      allow: ow.allow ? buildPermissions(ow.allow) : undefined,
      deny: ow.deny ? buildPermissions(ow.deny) : undefined,
    };
  }).filter(Boolean);
}
