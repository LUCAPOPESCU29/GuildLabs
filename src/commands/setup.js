import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  AttachmentBuilder,
} from "discord.js";
import { deployBlueprint } from "../lib/blueprint-deployer.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Deploy a Forge blueprint JSON to this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addAttachmentOption((opt) =>
      opt
        .setName("blueprint")
        .setDescription("Upload the blueprint.json file from the Forge builder")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const attachment = interaction.options.getAttachment("blueprint");

    if (!attachment.name.endsWith(".json")) {
      return interaction.editReply("❌ Please upload a valid `.json` file from the Forge builder.");
    }

    let blueprint;
    try {
      const res = await fetch(attachment.url);
      const raw = await res.json();
      // Support both the full wizard export {name, categories, roles, ...}
      // and a plain blueprint object
      blueprint = raw.blueprint ?? raw;
    } catch {
      return interaction.editReply("❌ Could not parse the JSON file. Make sure it's a valid Forge blueprint.");
    }

    if (!blueprint.categories || !blueprint.roles) {
      return interaction.editReply("❌ Invalid blueprint format — missing `categories` or `roles`.");
    }

    try {
      const log = await deployBlueprint(interaction.guild, blueprint);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("✅ Blueprint Deployed")
        .setDescription(
          `**${blueprint.name || "Server"}** has been set up with **${blueprint.roles.length - 1}** roles and **${blueprint.categories.reduce((n, c) => n + c.channels.length, 0)}** channels.`
        )
        .addFields({
          name: "Deployment Log",
          value: log.slice(0, 20).join("\n") + (log.length > 20 ? `\n…and ${log.length - 20} more` : ""),
        })
        .setFooter({ text: "Forge AI Discord Builder" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply(
        `❌ Deployment failed: ${err.message}\n\nMake sure the bot has **Administrator** permission.`
      );
    }
  },
};
