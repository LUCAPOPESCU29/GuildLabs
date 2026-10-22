import { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } from "discord.js";
import { replyError, replySuccess } from "../lib/embeds.js";

/**
 * Moderation for whoever runs an instance. Only the user IDs listed in
 * BEACON_ADMIN_USER_IDS can use it, regardless of their Discord permissions —
 * the check is in the handler, not in Discord's permission system.
 */
export default {
  data: new SlashCommandBuilder()
    .setName("beacon-admin")
    .setDescription("Instance admin: moderate the directory")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((s) => withTarget(s.setName("delist").setDescription("Unpublish a server (owner can re-publish)")))
    .addSubcommand((s) => withTarget(s.setName("ban").setDescription("Ban a server from the directory"), true))
    .addSubcommand((s) => withTarget(s.setName("unban").setDescription("Lift a ban")))
    .addSubcommand((s) => withTarget(s.setName("feature").setDescription("Feature a server on the home page")))
    .addSubcommand((s) => withTarget(s.setName("unfeature").setDescription("Stop featuring a server"))),

  async execute(interaction) {
    const { store, config, directory } = interaction.client.beacon;
    if (!config.adminUserIds.includes(interaction.user.id)) {
      return replyError(interaction, "Not allowed", "Only the instance admins listed in `BEACON_ADMIN_USER_IDS` can use this.");
    }

    const guildId = interaction.options.getString("guild_id").trim();
    const reason = interaction.options.getString("reason")?.trim() || null;
    const row = store.getGuild(guildId);
    if (!row) return replyError(interaction, "Unknown server", `No Beacon record for \`${guildId}\`.`);

    const sub = interaction.options.getSubcommand();
    let title;
    switch (sub) {
      case "delist":
        store.updateGuild(guildId, { published: 0 });
        title = `Delisted ${row.name}`;
        break;
      case "ban":
        store.updateGuild(guildId, { published: 0, banned: 1, ban_reason: reason });
        title = `Banned ${row.name}`;
        break;
      case "unban":
        store.updateGuild(guildId, { banned: 0, ban_reason: null });
        title = `Unbanned ${row.name}`;
        break;
      case "feature":
        store.updateGuild(guildId, { featured: 1 });
        title = `Featured ${row.name}`;
        break;
      case "unfeature":
        store.updateGuild(guildId, { featured: 0 });
        title = `Unfeatured ${row.name}`;
        break;
    }
    directory.invalidate();
    console.log(`[ADMIN] ${interaction.user.tag} → ${sub} ${guildId}${reason ? ` (${reason})` : ""}`);
    return replySuccess(interaction, title, reason ? `Reason: ${reason}` : "Done.");
  },
};

function withTarget(sub, withReason = false) {
  sub.addStringOption((o) => o.setName("guild_id").setDescription("The server's ID").setRequired(true).setMinLength(5).setMaxLength(25));
  if (withReason) {
    sub.addStringOption((o) => o.setName("reason").setDescription("Shown to the server's admins").setRequired(false).setMaxLength(200));
  }
  return sub;
}
