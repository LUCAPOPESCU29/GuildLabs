import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Config } from "../lib/config-store.js";
import {
  brandEmbed,
  successEmbed,
  replyError,
  BRAND,
  EPHEMERAL,
} from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("verify-panel")
    .setDescription("Post the Verify button in the configured verification channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply(EPHEMERAL);

    const cfg = Config.get(interaction.guild.id);
    if (!cfg.verifyChannelId || !cfg.verifyRoleId) {
      return replyError(
        interaction,
        "Verification isn't configured",
        "Run **`/config verification`** first, then come back."
      );
    }

    const channel = interaction.guild.channels.cache.get(cfg.verifyChannelId);
    if (!channel) {
      return replyError(
        interaction,
        "Verify channel is missing",
        "Re-run **`/config verification`** with a channel that still exists."
      );
    }

    // Bot must be able to send there
    const me = interaction.guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has(PermissionFlagsBits.SendMessages) || !perms?.has(PermissionFlagsBits.EmbedLinks)) {
      return replyError(
        interaction,
        `I can't post in ${channel}`,
        "Give me **Send Messages** and **Embed Links** there, then try again."
      );
    }

    // Hierarchy check
    const role = interaction.guild.roles.cache.get(cfg.verifyRoleId);
    if (role && role.position >= me.roles.highest.position) {
      return replyError(
        interaction,
        "My role is below the verify role",
        `Move my role **above** ${role} in **Server Settings → Roles**, then run \`/verify-panel\` again.`
      );
    }

    // Build the panel
    const panel = brandEmbed(BRAND.primary)
      .setTitle("✅ Verify to enter the server")
      .setDescription(
        `Welcome to **${interaction.guild.name}**!\n\n` +
          `Click the button below to confirm you're human. You'll be granted the ${role ?? "verify"} role and gain full access.`
      )
      .setThumbnail(interaction.guild.iconURL({ size: 256 }));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_user")
        .setLabel("Verify me")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [panel], components: [row] });

    const confirm = successEmbed(
      "Verification panel posted",
      `The Verify button is now live in ${channel}.`
    );
    return interaction.editReply({ embeds: [confirm] });
  },
};
