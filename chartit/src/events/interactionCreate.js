import { errorEmbed } from "../lib/embeds.js";

export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`[CMD] Unknown command: /${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[CMD] Error in /${interaction.commandName}:`, err);
      const embed = errorEmbed(
        `Something went wrong running \`/${interaction.commandName}\``,
        `\`\`\`${String(err?.message || "Unknown error").slice(0, 800)}\`\`\``
      );
      const payload = { embeds: [embed], flags: 64 };
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch (replyErr) {
        console.error(`[CMD] Could not deliver error:`, replyErr.message);
      }
    }
  },
};
