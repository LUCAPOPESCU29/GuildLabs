import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Config } from "../lib/config-store.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a support ticket"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const cfg = Config.get(guildId);

    if (!cfg.ticketCategoryId || !cfg.ticketRoleId) {
      return interaction.reply({ content: "❌ Tickets are not configured. Ask an admin to run `/config tickets`.", flags: 64 });
    }

    // Check for existing open ticket
    const existing = interaction.guild.channels.cache.find(
      (c) => c.name === `ticket-${interaction.user.username.toLowerCase()}` && c.parentId === cfg.ticketCategoryId
    );
    if (existing) {
      return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, flags: 64 });
    }

    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username.toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: cfg.ticketCategoryId,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: cfg.ticketRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
      ],
      reason: `Ticket opened by ${interaction.user.tag}`,
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🎫 Support Ticket")
      .setDescription(`Hello ${interaction.user}! Support will be with you shortly.\n\nDescribe your issue below.`)
      .setFooter({ text: "Click Close Ticket when resolved" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Close Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: `✅ Your ticket has been created: ${ticketChannel}`, flags: 64 });
  },
};
