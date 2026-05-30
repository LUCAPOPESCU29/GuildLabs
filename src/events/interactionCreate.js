import { Config } from "../lib/config-store.js";
import { PermissionFlagsBits } from "discord.js";

export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[CMD] Error in /${interaction.commandName}:`, err);
        const msg = { content: "❌ An error occurred. Please try again.", flags: 64 };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(msg);
        } else {
          await interaction.reply(msg);
        }
      }
      return;
    }

    // ── Button interactions ─────────────────────────────────────────────────
    if (interaction.isButton()) {
      // Verify button
      if (interaction.customId === "verify_user") {
        const cfg = Config.get(interaction.guild.id);
        if (!cfg.verifyRoleId) {
          return interaction.reply({ content: "❌ Verification is not configured.", flags: 64 });
        }
        const role = interaction.guild.roles.cache.get(cfg.verifyRoleId);
        if (!role) return interaction.reply({ content: "❌ Verify role not found.", flags: 64 });

        const member = interaction.member;
        if (member.roles.cache.has(role.id)) {
          return interaction.reply({ content: "✅ You're already verified!", flags: 64 });
        }

        await member.roles.add(role, "Forge verification");
        return interaction.reply({ content: `✅ Verified! You've been given the **${role.name}** role.`, flags: 64 });
      }

      // Close ticket button
      if (interaction.customId === "close_ticket") {
        const cfg = Config.get(interaction.guild.id);
        const member = interaction.member;
        const isSupport = cfg.ticketRoleId && member.roles.cache.has(cfg.ticketRoleId);
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isSupport && !isAdmin) {
          return interaction.reply({ content: "❌ Only support staff can close tickets.", flags: 64 });
        }

        await interaction.reply({ content: "🔒 Closing ticket in 5 seconds…" });
        setTimeout(() => interaction.channel.delete("Ticket closed").catch(() => {}), 5000);
      }
    }
  },
};
