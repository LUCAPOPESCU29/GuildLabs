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
    const cfg = Config.get(interaction.guild.id);
    if (!cfg.verifyChannelId || !cfg.verifyRoleId) {
      return interaction.reply({ content: "❌ Run `/config verification` first.", ephemeral: true });
    }

    const channel = interaction.guild.channels.cache.get(cfg.verifyChannelId);
    if (!channel) return interaction.reply({ content: "❌ Verify channel not found.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("✅ Verify to Enter")
      .setDescription(
        `Welcome to **${interaction.guild.name}**!\n\nClick the button below to verify you're human and gain access to the server.`
      )
      .setFooter({ text: "Forge Verification System" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verify_user")
        .setLabel("✅ Verify Me")
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: `✅ Verification panel posted in ${channel}.`, ephemeral: true });
  },
};
