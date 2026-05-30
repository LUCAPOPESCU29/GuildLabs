import { Config } from "../lib/config-store.js";
import { PermissionFlagsBits } from "discord.js";

export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.warn(`[CMD] Unknown command: /${interaction.commandName}`);
        return;
      }
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[CMD] Error in /${interaction.commandName}:`, err);

        // Surface the REAL reason so admins can actually fix it
        const reason = err?.message || "Unknown error";
        const content = `❌ Something went wrong running \`/${interaction.commandName}\`.\n\`\`\`${String(reason).slice(0, 500)}\`\`\``;

        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content });
          } else {
            await interaction.reply({ content, flags: 64 });
          }
        } catch (replyErr) {
          // Interaction already expired (>3s) or double-acknowledged — log only
          console.error(`[CMD] Could not deliver error message:`, replyErr.message);
        }
      }
      return;
    }

    // ── Button interactions ─────────────────────────────────────────────────
    if (interaction.isButton()) {
      try {
        // Verify button
        if (interaction.customId === "verify_user") {
          const cfg = Config.get(interaction.guild.id);
          if (!cfg.verifyRoleId) {
            return interaction.reply({ content: "❌ Verification is not configured. An admin needs to run `/config verification` first.", flags: 64 });
          }
          const role = interaction.guild.roles.cache.get(cfg.verifyRoleId);
          if (!role) return interaction.reply({ content: "❌ The verify role no longer exists. Ask an admin to reconfigure.", flags: 64 });

          // Bot must be able to assign this role
          const me = interaction.guild.members.me;
          if (role.position >= me.roles.highest.position) {
            return interaction.reply({ content: `❌ I can't assign **${role.name}** — my role must be ABOVE it in Server Settings → Roles.`, flags: 64 });
          }

          const member = interaction.member;
          if (member.roles.cache.has(role.id)) {
            return interaction.reply({ content: "✅ You're already verified!", flags: 64 });
          }

          await member.roles.add(role, "GuildLabs verification");
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
      } catch (err) {
        console.error(`[BTN] Error on button "${interaction.customId}":`, err);
        const content = `❌ ${err?.message || "Something went wrong."}`;
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, flags: 64 });
          } else {
            await interaction.reply({ content, flags: 64 });
          }
        } catch {}
      }
    }
  },
};
