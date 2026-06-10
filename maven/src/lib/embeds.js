import { EmbedBuilder } from "discord.js";

/**
 * Maven's visual identity — warm parchment/gold to distinguish from
 * Construct's blurple. Same embed-helper API as Construct so the muscle
 * memory carries.
 */
export const BRAND = {
  name: "Maven",
  primary: 0xc89b3c,  // warm gold (parchment, manuscript)
  success: 0x57f287,
  warning: 0xfee75c,
  danger: 0xed4245,
  muted: 0x4f545c,
};

const FOOTER = { text: "Maven — by GuildLabs" };

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
