import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { Config } from "../lib/config-store.js";

const CHECK = "✅";
const CROSS = "❌";

export default {
  data: new SlashCommandBuilder()
    .setName("diagnose")
    .setDescription("Check that GuildLabs has everything it needs to work")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const guild = interaction.guild;
    const me = guild.members.me;
    const cfg = Config.get(guild.id);

    // ── Permission checks ────────────────────────────────────────────────────
    const perms = [
      ["Manage Roles", me.permissions.has(PermissionFlagsBits.ManageRoles)],
      ["Manage Channels", me.permissions.has(PermissionFlagsBits.ManageChannels)],
      ["Kick Members", me.permissions.has(PermissionFlagsBits.KickMembers)],
      ["Ban Members", me.permissions.has(PermissionFlagsBits.BanMembers)],
      ["Send Messages", me.permissions.has(PermissionFlagsBits.SendMessages)],
      ["Embed Links", me.permissions.has(PermissionFlagsBits.EmbedLinks)],
    ];
    const permLines = perms.map(([name, ok]) => `${ok ? CHECK : CROSS} ${name}`).join("\n");

    // ── Role position ────────────────────────────────────────────────────────
    const highestOther = guild.roles.cache
      .filter((r) => r.id !== me.roles.highest.id && r.name !== "@everyone" && !r.managed)
      .sort((a, b) => b.position - a.position)
      .first();
    const myPos = me.roles.highest.position;
    const roleOk = !highestOther || myPos > highestOther.position;
    const roleLine = roleOk
      ? `${CHECK} My role is high enough to manage other roles.`
      : `${CROSS} My role is BELOW **${highestOther.name}**. Drag my role higher in Server Settings → Roles so I can manage roles/channels.`;

    // ── Feature config ─────────────────────────────────────────────────────────
    const featureLines = [
      `${cfg.welcomeChannelId ? CHECK : "⚪"} Welcome ${cfg.welcomeChannelId ? `→ <#${cfg.welcomeChannelId}>` : "(not set)"}`,
      `${cfg.verifyRoleId ? CHECK : "⚪"} Verification ${cfg.verifyRoleId ? `→ <@&${cfg.verifyRoleId}>` : "(not set)"}`,
      `${cfg.antiRaid ? CHECK : "⚪"} Anti-Raid ${cfg.antiRaid ? "(on)" : "(off)"}`,
      `${cfg.leveling ? CHECK : "⚪"} Leveling ${cfg.leveling ? "(on)" : "(off)"}`,
      `${cfg.ticketCategoryId ? CHECK : "⚪"} Tickets ${cfg.ticketCategoryId ? "(set up)" : "(not set)"}`,
    ].join("\n");

    const allGood = perms.every(([, ok]) => ok) && roleOk;

    const embed = new EmbedBuilder()
      .setColor(allGood ? 0x57f287 : 0xfee75c)
      .setTitle(allGood ? "✅ GuildLabs is fully operational" : "⚠️ GuildLabs needs attention")
      .addFields(
        { name: "Permissions", value: permLines, inline: false },
        { name: "Role Position", value: roleLine, inline: false },
        { name: "Features", value: featureLines, inline: false }
      )
      .setFooter({ text: allGood ? "Everything checks out — all commands will work." : "Fix the ❌ items above, then run /diagnose again." });

    return interaction.editReply({ embeds: [embed] });
  },
};
