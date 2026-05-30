import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Config } from "../lib/config-store.js";

export default {
  data: new SlashCommandBuilder()
    .setName("verify-panel")
    .setDescription("Post a verification panel in the verify channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const cfg = Config.get(interaction.guild.id);
    if (!cfg.verifyChannelId || !cfg.verifyRoleId) {
      return interaction.editReply("❌ Run `/config verification` first to set the channel and role.");
    }

    const channel = interaction.guild.channels.cache.get(cfg.verifyChannelId);
    if (!channel) return interaction.editReply("❌ The configured verify channel no longer exists. Re-run `/config verification`.");

    // Make sure the bot can actually post there
    const me = interaction.guild.members.me;
    if (!channel.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages)) {
      return interaction.editReply(`❌ I don't have permission to send messages in ${channel}. Give me access and try again.`);
    }

    const role = interaction.guild.roles.cache.get(cfg.verifyRoleId);
    if (role && role.position >= me.roles.highest.position) {
      return interaction.editReply(`⚠️ Heads up: my role is below **${role.name}**, so I won't be able to assign it. Move my role ABOVE it in Server Settings → Roles, then the Verify button will work.`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("✅ Verify to Enter")
      .setDescription(
        `Welcome to **${interaction.guild.name}**!\n\nClick the button below to verify you're human and gain access to the server.`
      )
      .setFooter({ text: "GuildLabs Verification" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_user")
        .setLabel("✅ Verify Me")
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });
    return interaction.editReply(`✅ Verification panel posted in ${channel}.`);
  },
};
