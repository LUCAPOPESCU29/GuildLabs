/**
 * Forget's embed design system.
 *
 * Discord gives you very few visual levers: one accent colour, an author row, a
 * thumbnail, fields, an image strip and a footer. Beauty comes from using them
 * *consistently* and leaving whitespace — not from stuffing every slot. Every
 * helper here returns an EmbedBuilder so callers can still tweak before sending.
 */

import { EmbedBuilder } from "discord.js";

// ── Brand tokens ────────────────────────────────────────────────────────────
export const FORGET = {
  name: "Forget",
  tagline: "your server's helper",
  // A calm violet spine, with intent colours that stay in the same family so a
  // channel full of Forget embeds reads as one system.
  accent: 0x8b5cf6,
  success: 0x34d399,
  warning: 0xfbbf24,
  danger: 0xf87171,
  info: 0x60a5fa,
  muted: 0x4b5563,
};

export const TONE = {
  accent: FORGET.accent,
  success: FORGET.success,
  warning: FORGET.warning,
  danger: FORGET.danger,
  info: FORGET.info,
  muted: FORGET.muted,
};

/** A thin rule that gives an embed breathing room without adding noise. */
export const DIVIDER = "─────────────────────────";

/** Zero-width-ish spacer field for aligning inline field grids. */
export const SPACER = { name: "​", value: "​", inline: true };

/**
 * The base every Forget embed starts from: accent colour, author row with the
 * bot's avatar, timestamp. Keeping the author row (not the title) as the brand
 * anchor leaves the title free for the actual message.
 */
export function forgetEmbed(client, tone = "accent") {
  const embed = new EmbedBuilder().setColor(TONE[tone] ?? FORGET.accent).setTimestamp();
  const avatar = client?.user?.displayAvatarURL?.({ size: 128 });
  embed.setAuthor({ name: `${FORGET.name} · ${FORGET.tagline}`, ...(avatar ? { iconURL: avatar } : {}) });
  return embed;
}

/**
 * Build a finished embed from AI (or fallback) copy.
 * `copy` is { title, description, fields[], footer } from forget-ai.js.
 */
export function embedFromCopy(client, copy, { tone = "accent", thumbnail, image, divider = true } = {}) {
  const embed = forgetEmbed(client, tone).setTitle(copy.title);

  const body = divider ? `${copy.description}\n\n${DIVIDER}` : copy.description;
  embed.setDescription(body);

  if (copy.fields?.length) embed.addFields(copy.fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);

  const footerBits = [copy.footer, copy.source === "offline" ? "offline mode" : null].filter(Boolean);
  if (footerBits.length) embed.setFooter({ text: footerBits.join(" • ") });

  return embed;
}

// ── Intent shorthands (used for Forget's own status messages) ───────────────
export function successEmbed(client, title, description) {
  return forgetEmbed(client, "success").setTitle(`✅  ${title}`).setDescription(description);
}

export function errorEmbed(client, title, description) {
  return forgetEmbed(client, "danger").setTitle(`⚠️  ${title}`).setDescription(description);
}

export function infoEmbed(client, title, description) {
  return forgetEmbed(client, "info").setTitle(title).setDescription(description);
}

/** Ephemeral reply flag (Discord's MessageFlags.Ephemeral). */
export const EPHEMERAL = { flags: 64 };

export async function replyError(interaction, title, description) {
  const payload = { embeds: [errorEmbed(interaction.client, title, description)], flags: 64 };
  return interaction.deferred || interaction.replied
    ? interaction.editReply(payload)
    : interaction.reply(payload);
}

/**
 * A compact report of where Forget decided to post and why — shown to the admin
 * who ran the command so the automatic behaviour is never a black box.
 */
export function detectionEmbed(client, ranked, chosen) {
  const embed = forgetEmbed(client, chosen ? "success" : "warning")
    .setTitle(chosen ? "Staff channel identified" : "No confident staff channel")
    .setDescription(
      chosen
        ? `I'll post staff embeds in ${chosen.channel}.\n\n${DIVIDER}`
        : `Nothing scored high enough to be sure, so I won't guess — pick one with **\`/forget channel\`**.\n\n${DIVIDER}`
    );

  const top = ranked.slice(0, 5);
  if (top.length) {
    embed.addFields({
      name: "What I looked at",
      value: top
        .map((r) => `${r.channel === chosen?.channel ? "**→**" : "　"} ${r.channel} · \`${r.score}\` — ${r.reasons[0] ?? "weak signal"}`)
        .join("\n")
        .slice(0, 1000),
    });
  } else {
    embed.addFields({
      name: "What I looked at",
      value: "_No channels I can post in scored above zero._",
    });
  }
  return embed;
}
