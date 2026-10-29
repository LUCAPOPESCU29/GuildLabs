import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { deployBlueprint } from "../lib/blueprint-deployer.js";
import { normalizeBlueprint } from "../lib/normalize-blueprint.js";
import {
  brandEmbed,
  successEmbed,
  errorEmbed,
  replyError,
  BRAND,
  EPHEMERAL,
} from "../lib/embeds.js";

// Discord caps attachment-driven JSON we'll happily parse. Anything larger is
// almost certainly not a blueprint.
const MAX_BLUEPRINT_BYTES = 1_000_000; // 1 MB

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Deploy a GuildLabs blueprint JSON to this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addAttachmentOption((opt) =>
      opt.setName("blueprint")
        .setDescription("Upload the blueprint.json file from the GuildLabs builder")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply(EPHEMERAL);

    // Interactions can arrive without guild data during gateway reconnects —
    // bail with a clear retry message instead of a TypeError.
    if (!interaction.guild) {
      return replyError(
        interaction,
        "Couldn't reach that server",
        "I just reconnected and lost track of this server for a moment. Please run `/setup` again."
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
        `I need **${missing.join("** and **")}** to create roles and channels. Give them to my role or re-invite me with Administrator.`
      );
    }

    // ── 2. Validate attachment ─────────────────────────────────────────────
    const attachment = interaction.options.getAttachment("blueprint");
    const looksJson =
      attachment.name?.toLowerCase().endsWith(".json") ||
      (attachment.contentType ?? "").includes("json");
    if (!looksJson) {
      return replyError(
        interaction,
        "Wrong file type",
        "Upload the `.json` file you exported from the GuildLabs builder " +
          "(the **Download JSON** button on any template, or **Export** in the wizard)."
      );
    }
    if (attachment.size && attachment.size > MAX_BLUEPRINT_BYTES) {
      return replyError(
        interaction,
        "That file is too large",
        "Blueprints are small JSON files. This one is over 1 MB — double-check you uploaded the right file."
      );
    }

    // ── 3. Fetch and parse ────────────────────────────────────────────────
    let raw;
    try {
      const res = await fetch(attachment.url);
      if (!res.ok) throw new Error(`download failed (HTTP ${res.status})`);
      const text = await res.text();
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error("the file isn't valid JSON");
      }
    } catch (e) {
      return replyError(
        interaction,
        "Couldn't read the blueprint",
        `\`${e.message}\`\nMake sure you uploaded the unedited \`.json\` file from the GuildLabs builder.`
      );
    }

    // ── 4. Normalise into the canonical shape the deployer understands. ────
    // Accepts grouped categories, flat channel lists, wizard/template/nested
    // formats — and reports exactly what went wrong when it can't.
    const result = normalizeBlueprint(raw);
    if (result.error) {
      return replyError(interaction, result.error.title, result.error.detail);
    }
    const { blueprint, warnings, stats } = result;

    // ── 5. Show a "working" status while we deploy ─────────────────────────
    const working = brandEmbed(BRAND.primary)
      .setTitle("🔨 Building your server…")
      .setDescription(
        `Deploying **${blueprint.name}** — ` +
          `${stats.roles} role${stats.roles === 1 ? "" : "s"}, ` +
          `${stats.channels} channel${stats.channels === 1 ? "" : "s"} ` +
          `across ${stats.categories} categor${stats.categories === 1 ? "y" : "ies"}.\n\n` +
          (warnings.length ? `_${warnings.join(" ")}_\n\n` : "") +
          `This usually takes 10-30 seconds depending on size.`
      );
    await interaction.editReply({ embeds: [working] });

    // ── 6. Deploy ──────────────────────────────────────────────────────────
    try {
      const log = await deployBlueprint(interaction.guild, blueprint);

      const skipped = log.filter((l) => l.startsWith("⏭️")).length;

      const embed = successEmbed(
        "Blueprint deployed",
        `**${blueprint.name}** is ready.`
      ).addFields(
        {
          name: "Summary",
          value:
            `**${stats.roles}** role${stats.roles === 1 ? "" : "s"} · ` +
            `**${stats.categories}** categor${stats.categories === 1 ? "y" : "ies"} · ` +
            `**${stats.channels}** channel${stats.channels === 1 ? "" : "s"}` +
            (skipped > 0 ? `\n*(${skipped} already existed and were skipped)*` : ""),
          inline: false,
        },
        {
          name: "Deployment log",
          value:
            log.slice(0, 20).join("\n") +
            (log.length > 20 ? `\n…and ${log.length - 20} more entries` : ""),
          inline: false,
        },
        {
          name: "Next steps",
          value:
            "• Set a **welcome message**: `/config welcome`\n" +
            "• Add a **verification gate**: `/config verification`\n" +
            "• Run `/diagnose` to make sure everything is healthy",
          inline: false,
        }
      );
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[CMD] /setup failed:", err);
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "Deployment failed",
            `\`\`\`${err.message}\`\`\`\nTip: make sure my role is **above** any role I'm trying to manage.`
          ),
        ],
      });
    }
  },
};
