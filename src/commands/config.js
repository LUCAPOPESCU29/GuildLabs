import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { Config } from "../lib/config-store.js";
import {
  successEmbed,
  infoEmbed,
  warningEmbed,
  brandEmbed,
  BRAND,
  EPHEMERAL,
} from "../lib/embeds.js";

// ── Slash command definition ────────────────────────────────────────────────
export default {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure GuildLabs for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s.setName("welcome")
        .setDescription("Set the welcome channel and message")
        .addChannelOption((o) =>
          o.setName("channel")
            .setDescription("Channel to send welcome messages in")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((o) =>
          o.setName("message")
            .setDescription("Message — use {user}, {server}, {username}")
            .setRequired(false)
        )
    )
    .addSubcommand((s) =>
      s.setName("verification")
        .setDescription("Set up a verification gate")
        .addChannelOption((o) =>
          o.setName("channel")
            .setDescription("Channel where the verify panel will be posted")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addRoleOption((o) =>
          o.setName("role")
            .setDescription("Role granted after a member verifies")
            .setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("antiraid")
        .setDescription("Configure anti-raid protection")
        .addBooleanOption((o) =>
          o.setName("enabled").setDescription("Enable or disable").setRequired(true)
        )
        .addIntegerOption((o) =>
          o.setName("threshold")
            .setDescription("Joins per 10s before action (default 10)")
            .setMinValue(2).setMaxValue(50)
            .setRequired(false)
        )
    )
    .addSubcommand((s) =>
      s.setName("leveling")
        .setDescription("Enable or disable XP leveling")
        .addBooleanOption((o) =>
          o.setName("enabled").setDescription("Enable or disable").setRequired(true)
        )
        .addChannelOption((o) =>
          o.setName("announce")
            .setDescription("Channel to announce level-ups (optional)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand((s) =>
      s.setName("tickets")
        .setDescription("Set up the ticket system")
        .addChannelOption((o) =>
          o.setName("category")
            .setDescription("Category that ticket channels will be created in")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addRoleOption((o) =>
          o.setName("support_role")
            .setDescription("Role that can see and reply to tickets")
            .setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("show").setDescription("Show the current GuildLabs config for this server")
    ),

  // ── Handler ───────────────────────────────────────────────────────────────
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    switch (sub) {
      case "welcome": return handleWelcome(interaction, guildId);
      case "verification": return handleVerification(interaction, guildId);
      case "antiraid": return handleAntiRaid(interaction, guildId);
      case "leveling": return handleLeveling(interaction, guildId);
      case "tickets": return handleTickets(interaction, guildId);
      case "show": return handleShow(interaction, guildId);
    }
  },
};

// ── Subcommand handlers ─────────────────────────────────────────────────────

async function handleWelcome(interaction, guildId) {
  const channel = interaction.options.getChannel("channel");
  const message =
    interaction.options.getString("message") ??
    "Welcome to **{server}**, {user}! 🎉";

  Config.merge(guildId, { welcomeChannelId: channel.id, welcomeMessage: message });

  const embed = successEmbed(
    "Welcome messages saved",
    `New members will be greeted in ${channel}.`
  ).addFields(
    { name: "Channel", value: `${channel}`, inline: true },
    { name: "Message", value: `\`\`\`${message}\`\`\``, inline: false },
    { name: "Placeholders", value: "`{user}` mentions them · `{server}` server name · `{username}` plain username", inline: false }
  );
  return interaction.reply({ embeds: [embed], ...EPHEMERAL });
}

async function handleVerification(interaction, guildId) {
  const channel = interaction.options.getChannel("channel");
  const role = interaction.options.getRole("role");

  Config.merge(guildId, { verifyChannelId: channel.id, verifyRoleId: role.id });

  // Hierarchy warning
  const me = interaction.guild.members.me;
  const hierarchyOk = role.position < me.roles.highest.position;

  const embed = successEmbed(
    "Verification gate set",
    `Members who click Verify in ${channel} will receive ${role}.`
  ).addFields(
    { name: "Channel", value: `${channel}`, inline: true },
    { name: "Role", value: `${role}`, inline: true },
    {
      name: "Next step",
      value: "Run **`/verify-panel`** to post the Verify button in that channel.",
      inline: false,
    }
  );

  const reply = await interaction.reply({ embeds: [embed], ...EPHEMERAL });

  if (!hierarchyOk) {
    await interaction.followUp({
      embeds: [warningEmbed(
        "My role is too low to assign this role",
        `Move my role **above** ${role} in **Server Settings → Roles**, otherwise the Verify button will fail.`
      )],
      ...EPHEMERAL,
    });
  }
  return reply;
}

async function handleAntiRaid(interaction, guildId) {
  const enabled = interaction.options.getBoolean("enabled");
  const threshold = interaction.options.getInteger("threshold") ?? 10;
  Config.merge(guildId, { antiRaid: enabled, antiRaidThreshold: threshold });

  const embed = successEmbed(
    enabled ? "Anti-raid enabled" : "Anti-raid disabled",
    enabled
      ? `If **${threshold}** members join within 10 seconds, joiners will be kicked automatically for 30 seconds.`
      : "Members can join freely. No automatic action will be taken."
  );
  if (enabled) {
    embed.addFields({ name: "Threshold", value: `${threshold} joins / 10s`, inline: true });
  }
  return interaction.reply({ embeds: [embed], ...EPHEMERAL });
}

async function handleLeveling(interaction, guildId) {
  const enabled = interaction.options.getBoolean("enabled");
  const announce = interaction.options.getChannel("announce");
  Config.merge(guildId, {
    leveling: enabled,
    levelAnnounceId: announce?.id ?? null,
  });

  const embed = successEmbed(
    enabled ? "Leveling enabled" : "Leveling disabled",
    enabled
      ? "Members earn **15-25 XP** per message (15-second cooldown). Use `/rank` and `/leaderboard` to see progress."
      : "No XP will be tracked."
  );
  if (enabled) {
    embed.addFields({
      name: "Level-up announcements",
      value: announce ? `${announce}` : "Posted in the same channel where the level-up happens",
      inline: false,
    });
  }
  return interaction.reply({ embeds: [embed], ...EPHEMERAL });
}

async function handleTickets(interaction, guildId) {
  const category = interaction.options.getChannel("category");
  const role = interaction.options.getRole("support_role");
  Config.merge(guildId, { ticketCategoryId: category.id, ticketRoleId: role.id });

  const embed = successEmbed(
    "Ticket system ready",
    `Members can now run **\`/ticket\`** to open a private support channel under ${category}.`
  ).addFields(
    { name: "Category", value: `${category}`, inline: true },
    { name: "Support team", value: `${role}`, inline: true },
    {
      name: "How it works",
      value: "Each ticket is a private text channel only the member and support role can see. Staff click **Close Ticket** to delete it.",
      inline: false,
    }
  );
  return interaction.reply({ embeds: [embed], ...EPHEMERAL });
}

async function handleShow(interaction, guildId) {
  const cfg = Config.get(guildId);

  const lines = (key, on, off) => (cfg[key] ? on(cfg) : off);

  const welcome = lines(
    "welcomeChannelId",
    (c) => `Channel: <#${c.welcomeChannelId}>\nMessage: \`${c.welcomeMessage ?? "(default)"}\``,
    "*Not configured*"
  );
  const verify = lines(
    "verifyRoleId",
    (c) => `Channel: <#${c.verifyChannelId}>\nRole: <@&${c.verifyRoleId}>`,
    "*Not configured*"
  );
  const antiraid = cfg.antiRaid
    ? `Enabled — threshold ${cfg.antiRaidThreshold ?? 10}/10s`
    : "Disabled";
  const leveling = cfg.leveling
    ? `Enabled${cfg.levelAnnounceId ? ` — announces in <#${cfg.levelAnnounceId}>` : ""}`
    : "Disabled";
  const tickets = lines(
    "ticketCategoryId",
    (c) => `Category: <#${c.ticketCategoryId}>\nSupport: <@&${c.ticketRoleId}>`,
    "*Not configured*"
  );

  const embed = brandEmbed(BRAND.primary)
    .setTitle("GuildLabs configuration")
    .setDescription(`Current settings for **${interaction.guild.name}**`)
    .addFields(
      { name: "👋 Welcome", value: welcome, inline: false },
      { name: "🔒 Verification", value: verify, inline: false },
      { name: "🛡️ Anti-Raid", value: antiraid, inline: true },
      { name: "📈 Leveling", value: leveling, inline: true },
      { name: "🎫 Tickets", value: tickets, inline: false }
    );
  return interaction.reply({ embeds: [embed], ...EPHEMERAL });
}
