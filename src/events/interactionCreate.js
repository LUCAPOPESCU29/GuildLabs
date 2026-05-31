import { PermissionFlagsBits } from "discord.js";
import { Config } from "../lib/config-store.js";
import {
  brandEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  BRAND,
  EPHEMERAL,
} from "../lib/embeds.js";

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
      return;
    }

    // ── Button interactions ─────────────────────────────────────────────────
    if (interaction.isButton()) {
      try {
        if (interaction.customId === "verify_user") return handleVerifyButton(interaction);
        if (interaction.customId === "close_ticket") return handleCloseTicket(interaction);
      } catch (err) {
        console.error(`[BTN] Error on "${interaction.customId}":`, err);
        const embed = errorEmbed("Something went wrong", err?.message || "Unknown error");
        const payload = { embeds: [embed], flags: 64 };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(payload);
          } else {
            await interaction.reply(payload);
          }
        } catch {}
      }
    }
  },
};

// ── Button handlers ─────────────────────────────────────────────────────────

async function handleVerifyButton(interaction) {
  const cfg = Config.get(interaction.guild.id);
  if (!cfg.verifyRoleId) {
    return interaction.reply({
      embeds: [errorEmbed("Verification isn't set up", "An admin needs to run `/config verification` and `/verify-panel`.")],
      ...EPHEMERAL,
    });
  }
  const role = interaction.guild.roles.cache.get(cfg.verifyRoleId);
  if (!role) {
    return interaction.reply({
      embeds: [errorEmbed("Verify role missing", "The role no longer exists. Ask an admin to reconfigure.")],
      ...EPHEMERAL,
    });
  }
  const me = interaction.guild.members.me;
  if (role.position >= me.roles.highest.position) {
    return interaction.reply({
      embeds: [errorEmbed(
        "I can't assign that role",
        `My role must be **above** ${role} in **Server Settings → Roles**. Tell a server admin.`
      )],
      ...EPHEMERAL,
    });
  }
  if (interaction.member.roles.cache.has(role.id)) {
    return interaction.reply({
      embeds: [warningEmbed("You're already verified", `You already have the ${role} role.`)],
      ...EPHEMERAL,
    });
  }
  await interaction.member.roles.add(role, "GuildLabs verification");
  return interaction.reply({
    embeds: [successEmbed("Verified!", `You've been given the ${role} role. Welcome in.`)],
    ...EPHEMERAL,
  });
}

async function handleCloseTicket(interaction) {
  const cfg = Config.get(interaction.guild.id);
  const member = interaction.member;
  const isSupport = cfg.ticketRoleId && member.roles.cache.has(cfg.ticketRoleId);
  const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

  if (!isSupport && !isAdmin) {
    return interaction.reply({
      embeds: [errorEmbed("Not allowed", "Only support staff or admins can close tickets.")],
      ...EPHEMERAL,
    });
  }

  const embed = brandEmbed(BRAND.warning)
    .setTitle("🔒 Closing ticket")
    .setDescription(`Closed by ${member}. This channel will be deleted in 5 seconds.`);

  await interaction.reply({ embeds: [embed] });
  setTimeout(
    () => interaction.channel.delete(`Ticket closed by ${interaction.user.tag}`).catch(() => {}),
    5000
  );
}
