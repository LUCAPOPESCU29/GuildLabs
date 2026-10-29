import { EmbedBuilder } from "discord.js";

// ── Brand tokens ────────────────────────────────────────────────────────────
export const BRAND = {
  name: "GuildLabs",
  primary: 0x5865f2, // blurple — neutral
  success: 0x57f287, // green
  warning: 0xfee75c, // yellow
  danger: 0xed4245,  // red
  muted: 0x4f545c,
};

const FOOTER = { text: "GuildLabs — AI Discord Server Builder" };

// ── Embed helpers ───────────────────────────────────────────────────────────
export function brandEmbed(color = BRAND.primary) {
  return new EmbedBuilder().setColor(color).setFooter(FOOTER).setTimestamp();
}

export function successEmbed(title, description) {
  return brandEmbed(BRAND.success).setTitle(`✅ ${title}`).setDescription(description);
}

export function errorEmbed(title, description) {
  return brandEmbed(BRAND.danger).setTitle(`❌ ${title}`).setDescription(description);
}

export function warningEmbed(title, description) {
  return brandEmbed(BRAND.warning).setTitle(`⚠️ ${title}`).setDescription(description);
}

export function infoEmbed(title, description) {
  return brandEmbed(BRAND.primary).setTitle(title).setDescription(description);
}

// ── Common reply patterns ───────────────────────────────────────────────────
export const EPHEMERAL = { flags: 64 };

export async function replyError(interaction, title, description) {
  const embed = errorEmbed(title, description);
  const payload = { embeds: [embed], flags: 64 };
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

export async function replySuccess(interaction, title, description) {
  const embed = successEmbed(title, description);
  const payload = { embeds: [embed], flags: 64 };
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// ── Progress bar ────────────────────────────────────────────────────────────
/** Render a 10-cell progress bar with current/needed XP. */
export function progressBar(current, needed, width = 12) {
  const ratio = Math.min(1, Math.max(0, current / Math.max(1, needed)));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}
