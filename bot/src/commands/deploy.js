import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { deployBlueprint } from "../lib/blueprint-deployer.js";
import { normalizeBlueprint } from "../lib/normalize-blueprint.js";
import { successEmbed, replyError, EPHEMERAL } from "../lib/embeds.js";
import { normalizeCode } from "../lib/claim-code.js";

// Public site the bot pulls blueprints from. Override with SITE_URL in .env.
const SITE_URL = (process.env.SITE_URL || "https://www.guildlabs.fun").replace(/\/+$/, "");
const BOT_API_KEY = process.env.BOT_API_KEY ?? "forge-local-dev";

export default {
  data: new SlashCommandBuilder()
    .setName("deploy")
    .setDescription("Build a server from a GuildLabs code (get one on the site)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName("code")
        .setDescription("The deploy code from guildlabs.fun, e.g. ABCD-1234")
        .setRequired(true)
        .setMinLength(8)
        .setMaxLength(12)
    ),

  async execute(interaction) {
    await interaction.deferReply(EPHEMERAL);

    // Interactions can arrive without guild data during gateway reconnects —
    // bail with a clear retry message instead of a TypeError.
    if (!interaction.guild) {
      return replyError(
        interaction,
        "Couldn't reach that server",
        "I just reconnected and lost track of this server for a moment. Please run `/deploy` again."
      );
    }

    // ── 1. Permission preflight ────────────────────────────────────────────
    const me = interaction.guild.members.me;
    const missing = [];
    if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) missing.push("Manage Roles");
    if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) missing.push("Manage Channels");
    if (missing.length) {
      return replyError(
        interaction,
        "I'm missing required permissions",
        `I need **${missing.join("** and **")}** to create roles and channels. ` +
          `Give them to my role or re-invite me with Administrator.`
      );
    }

    // ── 2. Redeem the code against the site ────────────────────────────────
    const code = normalizeCode(interaction.options.getString("code"));
    if (code.length !== 8) {
      return replyError(
        interaction,
        "That doesn't look like a deploy code",
        "Codes look like `ABCD-1234`. Generate one on the site by clicking **Deploy to Discord**."
      );
    }

    let payload;
    try {
      const res = await fetch(`${SITE_URL}/api/construct/claim/${code}`, {
        headers: { "x-api-key": BOT_API_KEY },
      });
      payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        return replyError(
          interaction,
          "Couldn't use that code",
          payload?.error ||
            "The code is invalid or expired. Generate a fresh one on the site and try again."
        );
      }
    } catch (err) {
      console.error("[/deploy] fetch failed:", err);
      return replyError(
        interaction,
        "Couldn't reach GuildLabs",
        "I couldn't contact the site to fetch your blueprint. Try again in a moment."
      );
    }

    // ── 3. Normalize + build ───────────────────────────────────────────────
    const result = normalizeBlueprint(payload.blueprint);
    if (result.error) {
      return replyError(interaction, result.error.title, result.error.detail);
    }
    const { blueprint, stats } = result;

    try {
      const log = await deployBlueprint(interaction.guild, blueprint);
      const created = log.filter(
        (l) => l.startsWith("✅") || l.startsWith("📁") || l.startsWith("  #")
      ).length;
      const skipped = log.filter((l) => l.startsWith("⏭️")).length;

      const embed = successEmbed(
        "Server built!",
        `Created from your GuildLabs blueprint.\n\n` +
          `**${stats.roles}** roles · **${stats.categories}** categories · **${stats.channels}** channels` +
          (skipped ? `\n${skipped} item${skipped === 1 ? "" : "s"} already existed and ${skipped === 1 ? "was" : "were"} skipped.` : "")
      );
      return interaction.editReply({ embeds: [embed], flags: 64 });
    } catch (err) {
      console.error("[/deploy] build failed:", err);
      return replyError(
        interaction,
        "Build failed partway through",
        err?.message || "Something went wrong while creating channels. Check my role position and permissions."
      );
    }
  },
};
