import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Config } from "../lib/config-store.js";
import {
  brandEmbed,
  successEmbed,
  errorEmbed,
  replyError,
  BRAND,
  EPHEMERAL,
} from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a private support ticket"),

  async execute(interaction) {
    await interaction.deferReply(EPHEMERAL);

    const cfg = Config.get(interaction.guild.id);
    if (!cfg.ticketCategoryId || !cfg.ticketRoleId) {
      return replyError(
        interaction,
        "Tickets aren't set up yet",
        "Ask an admin to run **`/config tickets`** first."
      );
    }

    // Validate the category still exists
    const category = interaction.guild.channels.cache.get(cfg.ticketCategoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      return replyError(
        interaction,
        "Ticket category is missing",
        "Ask an admin to re-run **`/config tickets`** with a valid category."
      );
    }

    // Permission preflight
    const me = interaction.guild.members.me;
    if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return replyError(
        interaction,
        "I'm missing the Manage Channels permission",
        "Give me that permission and try again. `/diagnose` shows the full checklist."
      );
    }

    // Already-open ticket?
    const safeName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9-]/g, "")}`;
    const existing = interaction.guild.channels.cache.find(
      (c) => c.name === safeName && c.parentId === cfg.ticketCategoryId
    );
    if (existing) {
      const embed = brandEmbed(BRAND.warning)
        .setTitle("You already have an open ticket")
        .setDescription(`Continue the conversation in ${existing}, or click **Close Ticket** there to close it.`);
      return interaction.editReply({ embeds: [embed] });
    }

    // Create the ticket channel
    const ticketChannel = await interaction.guild.channels.create({
      name: safeName,
      type: ChannelType.GuildText,
      parent: cfg.ticketCategoryId,
      topic: `Ticket opened by ${interaction.user.tag} · ${interaction.user.id}`,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: cfg.ticketRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ],
      reason: `Ticket opened by ${interaction.user.tag}`,
    });

    // Welcome message inside the ticket
    const welcome = brandEmbed(BRAND.primary)
      .setTitle("🎫 Support ticket")
      .setDescription(
        `Hi ${interaction.user}, support will be with you shortly.\n\nPlease describe your issue in detail — screenshots welcome.`
      )
      .addFields({
        name: "How this works",
        value:
          "• Only you and the support team can see this channel\n" +
          "• Staff click **Close Ticket** when it's resolved\n" +
          "• The channel will be deleted 5 seconds after closing",
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `${interaction.user} <@&${cfg.ticketRoleId}>`,
      embeds: [welcome],
      components: [row],
    });

    const confirm = successEmbed(
      "Your ticket is ready",
      `Head over to ${ticketChannel} to chat with support.`
    );
    return interaction.editReply({ embeds: [confirm] });
  },
};
