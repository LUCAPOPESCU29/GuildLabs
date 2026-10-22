import { PermissionFlagsBits } from "discord.js";
import { errorEmbed } from "../lib/embeds.js";
import {
  IDS as SETUP,
  handleSetupModal,
  handleTagMenu,
  handleTagsContinue,
  handleChannelSelect,
} from "../flows/setup.js";
import { IDS as REMOVE, handleRemoveConfirm, handleRemoveCancel } from "../flows/remove.js";

export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    try {
      // ── Slash commands ──────────────────────────────────────────────────
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return console.warn(`[CMD] Unknown command: /${interaction.commandName}`);
        if (!interaction.guild) {
          return interaction.reply({ embeds: [errorEmbed("Server only", "Beacon commands work inside a server.")], flags: 64 });
        }
        return await command.execute(interaction);
      }

      // Everything below is a step in a flow started by /beacon — the message
      // is ephemeral, but still insist on Manage Server so a stray click can't
      // change a page.
      if (!interaction.guild) return;
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ embeds: [errorEmbed("Not allowed", "You need **Manage Server** to change this server's page.")], flags: 64 });
      }

      if (interaction.isModalSubmit() && interaction.customId === SETUP.modal) return await handleSetupModal(interaction);
      if (interaction.isStringSelectMenu() && (interaction.customId === SETUP.tagsA || interaction.customId === SETUP.tagsB)) {
        return await handleTagMenu(interaction);
      }
      if (interaction.isChannelSelectMenu() && interaction.customId === SETUP.channel) return await handleChannelSelect(interaction);
      if (interaction.isButton()) {
        if (interaction.customId === SETUP.tagsContinue) return await handleTagsContinue(interaction);
        if (interaction.customId === REMOVE.confirm) return await handleRemoveConfirm(interaction);
        if (interaction.customId === REMOVE.cancel) return await handleRemoveCancel(interaction);
      }
    } catch (err) {
      const where = interaction.commandName ? `/${interaction.commandName}` : interaction.customId ?? "interaction";
      console.error(`[CMD] Error in ${where}:`, err);
      const payload = {
        embeds: [errorEmbed("Something went wrong", `\`\`\`${String(err?.message || "Unknown error").slice(0, 800)}\`\`\``)],
        flags: 64,
      };
      try {
        if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
        else await interaction.reply(payload);
      } catch (replyErr) {
        console.error("[CMD] Could not deliver error:", replyErr.message);
      }
    }
  },
};
