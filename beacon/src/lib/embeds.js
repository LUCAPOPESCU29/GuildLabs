import { EmbedBuilder } from "discord.js";

// ── Brand tokens ────────────────────────────────────────────────────────────
// A warm signal amber — a lighthouse, not a siren. Intent colours stay muted so
// a channel full of Beacon embeds reads as one calm system.
export const BRAND = {
  name: "Beacon",
  primary: 0xf59e0b, // amber
  success: 0x34d399,
  warning: 0xfbbf24,
  danger: 0xf87171,
  muted: 0x4b5563,
};

const FOOTER = { text: "Beacon — Get found." };

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

async function deliver(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

export async function replyError(interaction, title, description) {
  return deliver(interaction, { embeds: [errorEmbed(title, description)], flags: 64 });
}

export async function replySuccess(interaction, title, description) {
  return deliver(interaction, { embeds: [successEmbed(title, description)], flags: 64 });
}

export async function replyEmbed(interaction, embed, extra = {}) {
  return deliver(interaction, { embeds: [embed], flags: 64, ...extra });
}
