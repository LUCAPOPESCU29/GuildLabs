import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { deployBlueprint } from "../lib/blueprint-deployer.js";
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
    if (!attachment.name.toLowerCase().endsWith(".json")) {
      return replyError(
        interaction,
        "Wrong file type",
        "Upload the `.json` file you exported from the GuildLabs builder."
      );
    }

    // ── 3. Fetch and parse ────────────────────────────────────────────────
    let blueprint;
    try {
      const res = await fetch(attachment.url);
      if (!res.ok) throw new Error(`fetch returned ${res.status}`);
      const raw = await res.json();
      blueprint = raw.blueprint ?? raw;
    } catch (e) {
      return replyError(
        interaction,
        "Couldn't read the blueprint",
        `\`${e.message}\`\nMake sure the file is valid JSON exported from the GuildLabs builder.`
      );
    }

    if (!Array.isArray(blueprint.categories) || !Array.isArray(blueprint.roles)) {
      return replyError(
        interaction,
        "Invalid blueprint format",
        "The file is missing `categories` or `roles`. Export a fresh one from the builder."
      );
    }

    // ── 4. Show a "working" status while we deploy ─────────────────────────
    const working = brandEmbed(BRAND.primary)
      .setTitle("🔨 Building your server…")
      .setDescription(
        `Deploying **${blueprint.name || "blueprint"}** — ` +
          `${blueprint.roles.length} roles, ` +
          `${blueprint.categories.reduce((n, c) => n + c.channels.length, 0)} channels.\n\n` +
          `This usually takes 10-30 seconds depending on size.`
      );
    await interaction.editReply({ embeds: [working] });

    // ── 5. Deploy ──────────────────────────────────────────────────────────
    try {
      const log = await deployBlueprint(interaction.guild, blueprint);

      const created = log.filter((l) => l.startsWith("✅") || l.startsWith("📁") || l.startsWith("  #")).length;
      const skipped = log.filter((l) => l.startsWith("⏭️")).length;

      const embed = successEmbed(
        "Blueprint deployed",
        `**${blueprint.name || "Your server"}** is ready.`
      ).addFields(
        {
          name: "Summary",
          value:
            `**${blueprint.roles.length - 1}** roles · ` +
            `**${blueprint.categories.length}** categories · ` +
            `**${blueprint.categories.reduce((n, c) => n + c.channels.length, 0)}** channels` +
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
