import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { Config } from "../lib/config-store.js";

export default {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure Forge bot features for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // welcome
    .addSubcommand((s) =>
      s.setName("welcome")
        .setDescription("Set the welcome channel and message")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to send welcome messages in").setRequired(true))
        .addStringOption((o) => o.setName("message").setDescription("Welcome message — use {user} for mention, {server} for name").setRequired(false))
    )
    // verification
    .addSubcommand((s) =>
      s.setName("verification")
        .setDescription("Set up a verification gate")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel where users verify").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role granted after verification").setRequired(true))
    )
    // anti-raid
    .addSubcommand((s) =>
      s.setName("antiraid")
        .setDescription("Configure anti-raid protection")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable anti-raid").setRequired(true))
        .addIntegerOption((o) => o.setName("threshold").setDescription("Max joins per 10s before lockdown (default: 10)").setRequired(false))
    )
    // leveling
    .addSubcommand((s) =>
      s.setName("leveling")
        .setDescription("Enable XP leveling")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable leveling").setRequired(true))
        .addChannelOption((o) => o.setName("announce").setDescription("Channel to announce level-ups in").setRequired(false))
    )
    // tickets
    .addSubcommand((s) =>
      s.setName("tickets")
        .setDescription("Set up the ticket system")
        .addChannelOption((o) => o.setName("category").setDescription("Category to create ticket channels in").setRequired(true))
        .addRoleOption((o) => o.setName("support_role").setDescription("Role that can see tickets").setRequired(true))
    )
    // show
    .addSubcommand((s) =>
      s.setName("show").setDescription("Show the current bot config for this server")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "show") {
      const cfg = Config.get(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("⚙️ Forge Bot Config")
        .setDescription("Current settings for this server:")
        .addFields(
          { name: "Welcome", value: cfg.welcomeChannelId ? `<#${cfg.welcomeChannelId}> — "${cfg.welcomeMessage || "Welcome, {user}!"}"` : "Not configured", inline: false },
          { name: "Verification", value: cfg.verifyChannelId ? `<#${cfg.verifyChannelId}> → <@&${cfg.verifyRoleId}>` : "Not configured", inline: false },
          { name: "Anti-Raid", value: cfg.antiRaid ? `✅ Enabled (threshold: ${cfg.antiRaidThreshold ?? 10}/10s)` : "❌ Disabled", inline: false },
          { name: "Leveling", value: cfg.leveling ? `✅ Enabled${cfg.levelAnnounceId ? ` → <#${cfg.levelAnnounceId}>` : ""}` : "❌ Disabled", inline: false },
          { name: "Tickets", value: cfg.ticketCategoryId ? `<#${cfg.ticketCategoryId}> | Support: <@&${cfg.ticketRoleId}>` : "Not configured", inline: false },
        )
        .setFooter({ text: "Use /config <feature> to change settings" });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "welcome") {
      const channel = interaction.options.getChannel("channel");
      const message = interaction.options.getString("message") ?? "Welcome to **{server}**, {user}! 🎉";
      Config.merge(guildId, { welcomeChannelId: channel.id, welcomeMessage: message });
      return interaction.reply({ content: `✅ Welcome messages will be sent in ${channel} with message:\n> ${message}`, ephemeral: true });
    }

    if (sub === "verification") {
      const channel = interaction.options.getChannel("channel");
      const role = interaction.options.getRole("role");
      Config.merge(guildId, { verifyChannelId: channel.id, verifyRoleId: role.id });
      return interaction.reply({ content: `✅ Verification set up in ${channel}. Users will get <@&${role.id}> after clicking Verify.`, ephemeral: true });
    }

    if (sub === "antiraid") {
      const enabled = interaction.options.getBoolean("enabled");
      const threshold = interaction.options.getInteger("threshold") ?? 10;
      Config.merge(guildId, { antiRaid: enabled, antiRaidThreshold: threshold });
      return interaction.reply({ content: `✅ Anti-raid ${enabled ? `enabled (threshold: ${threshold} joins/10s)` : "disabled"}.`, ephemeral: true });
    }

    if (sub === "leveling") {
      const enabled = interaction.options.getBoolean("enabled");
      const announce = interaction.options.getChannel("announce");
      Config.merge(guildId, { leveling: enabled, levelAnnounceId: announce?.id ?? null });
      return interaction.reply({ content: `✅ Leveling ${enabled ? "enabled" : "disabled"}${announce ? ` — level-ups announced in ${announce}` : ""}.`, ephemeral: true });
    }

    if (sub === "tickets") {
      const category = interaction.options.getChannel("category");
      const role = interaction.options.getRole("support_role");
      Config.merge(guildId, { ticketCategoryId: category.id, ticketRoleId: role.id });
      return interaction.reply({ content: `✅ Tickets enabled in category ${category} — <@&${role.id}> will have access.`, ephemeral: true });
    }
  },
};
