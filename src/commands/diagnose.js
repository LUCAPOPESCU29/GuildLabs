import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Config } from "../lib/config-store.js";
import { brandEmbed, BRAND, EPHEMERAL } from "../lib/embeds.js";

const OK = "✅";
const NO = "❌";
const DOT = "⚪";

export default {
  data: new SlashCommandBuilder()
    .setName("diagnose")
    .setDescription("Check that GuildLabs has everything it needs to work")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply(EPHEMERAL);

    const guild = interaction.guild;
    const me = guild.members.me;
    const cfg = Config.get(guild.id);

    // ── Permissions ─────────────────────────────────────────────────────────
    const checks = [
      ["Manage Roles", PermissionFlagsBits.ManageRoles],
      ["Manage Channels", PermissionFlagsBits.ManageChannels],
      ["Kick Members", PermissionFlagsBits.KickMembers],
      ["Ban Members", PermissionFlagsBits.BanMembers],
      ["Send Messages", PermissionFlagsBits.SendMessages],
      ["Embed Links", PermissionFlagsBits.EmbedLinks],
    ];
    const permLines = checks
      .map(([name, flag]) => `${me.permissions.has(flag) ? OK : NO} ${name}`)
      .join("\n");
    const permsOk = checks.every(([, flag]) => me.permissions.has(flag));

    // ── Role position ───────────────────────────────────────────────────────
    const highestOther = guild.roles.cache
      .filter((r) => r.id !== me.roles.highest.id && r.name !== "@everyone" && !r.managed)
      .sort((a, b) => b.position - a.position)
      .first();
    const myPos = me.roles.highest.position;
    const roleOk = !highestOther || myPos > highestOther.position;
    const roleLine = roleOk
      ? `${OK} My role is above other roles — I can manage them.`
      : `${NO} My role is **below** ${highestOther}. Drag my role higher in **Server Settings → Roles**.`;

    // ── Feature config ──────────────────────────────────────────────────────
    const featureLines = [
      `${cfg.welcomeChannelId ? OK : DOT} **Welcome** ${cfg.welcomeChannelId ? `→ <#${cfg.welcomeChannelId}>` : "*(not set — `/config welcome`)*"}`,
      `${cfg.verifyRoleId ? OK : DOT} **Verification** ${cfg.verifyRoleId ? `→ <@&${cfg.verifyRoleId}> in <#${cfg.verifyChannelId}>` : "*(not set — `/config verification`)*"}`,
      `${cfg.antiRaid ? OK : DOT} **Anti-Raid** ${cfg.antiRaid ? `(${cfg.antiRaidThreshold ?? 10}/10s)` : "*(off — `/config antiraid`)*"}`,
      `${cfg.leveling ? OK : DOT} **Leveling** ${cfg.leveling ? (cfg.levelAnnounceId ? `→ <#${cfg.levelAnnounceId}>` : "(announces inline)") : "*(off — `/config leveling`)*"}`,
      `${cfg.ticketCategoryId ? OK : DOT} **Tickets** ${cfg.ticketCategoryId ? `→ <#${cfg.ticketCategoryId}>` : "*(not set — `/config tickets`)*"}`,
    ].join("\n");

    // ── Overall ────────────────────────────────────────────────────────────
    const healthy = permsOk && roleOk;

    const embed = brandEmbed(healthy ? BRAND.success : BRAND.warning)
      .setTitle(healthy ? "✅ GuildLabs is fully operational" : "⚠️ GuildLabs needs a couple things")
      .setDescription(
        healthy
          ? "Everything looks good. Every command will work as expected."
          : "Fix the items marked ❌ below, then run `/diagnose` again."
      )
      .addFields(
        { name: "Permissions", value: permLines, inline: true },
        { name: "Role position", value: roleLine, inline: false },
        { name: "Features", value: featureLines, inline: false }
      );

    return interaction.editReply({ embeds: [embed] });
  },
};
