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
    await interaction.deferReply({ flags: 64 });

    const guildId = interaction.guild.id;
    const cfg = Config.get(guildId);

    if (!cfg.ticketCategoryId || !cfg.ticketRoleId) {
      return interaction.editReply("❌ Tickets aren't configured yet. An admin needs to run `/config tickets`.");
    }

    // Validate the category still exists
    const category = interaction.guild.channels.cache.get(cfg.ticketCategoryId);
    if (!category) {
      return interaction.editReply("❌ The ticket category no longer exists. Ask an admin to re-run `/config tickets`.");
    }

    // Bot needs Manage Channels to create the ticket
    const me = interaction.guild.members.me;
    if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply("❌ I need the **Manage Channels** permission to create ticket channels.");
    }

    // Check for an existing open ticket
    const safeName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const existing = interaction.guild.channels.cache.find(
      (c) => c.name === safeName && c.parentId === cfg.ticketCategoryId
    );
    if (existing) {
      return interaction.editReply(`❌ You already have an open ticket: ${existing}`);
    }

    const ticketChannel = await interaction.guild.channels.create({
      name: safeName,
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

    await ticketChannel.send({ content: `${interaction.user} <@&${cfg.ticketRoleId}>`, embeds: [embed], components: [row] });
    return interaction.editReply(`✅ Your ticket has been created: ${ticketChannel}`);
  },
};
