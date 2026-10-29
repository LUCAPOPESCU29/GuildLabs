/**
 * Forget's embed design system.
 *
 * Discord gives you very few visual levers, so beauty comes from using the real
 * ones deliberately rather than filling every slot:
 *   · the accent stripe down the left edge  (setColor)
 *   · markdown headings and `-#` subtext    (description)
 *   · an inline field grid, 3 to a row      (addFields)
 *   · a full-width image at the bottom      (setImage)
 * The banner is generated per-embed in `banner.js` so its gradient always
 * matches the accent — that tint match is what makes it read as designed
 * rather than decorated.
 */

import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { banner, gradientRule } from "./banner.js";

// ── Brand tokens ────────────────────────────────────────────────────────────
export const FORGET = {
  name: "Forget",
  tagline: "your server's helper",
  accent: 0x8b5cf6,
  success: 0x34d399,
  warning: 0xfbbf24,
  danger: 0xf87171,
  info: 0x60a5fa,
  muted: 0x6b7280,
};

export const TONE = {
  accent: FORGET.accent,
  success: FORGET.success,
  warning: FORGET.warning,
  danger: FORGET.danger,
  info: FORGET.info,
  muted: FORGET.muted,
};

/** Glyphs used as quiet section markers. One family, no emoji soup. */
export const GLYPH = {
  accent: "◆",
  success: "✦",
  warning: "▲",
  danger: "■",
  info: "◇",
  muted: "·",
};

export const ZWSP = "​";
/** Legacy text rule — kept for plain contexts where an image is overkill. */
export const DIVIDER = "─────────────────────────";

// ── Text helpers ────────────────────────────────────────────────────────────

/** Discord subtext: smaller, dimmer. Perfect for captions and metadata. */
export const subtext = (s) => `-# ${s}`;

/** A live, locale-aware relative timestamp ("in 3 hours", "2 days ago"). */
export const relTime = (date = new Date()) => `<t:${Math.floor(date.getTime() / 1000)}:R>`;

/**
 * An ANSI-coloured callout block. Discord renders ```ansi fences with real
 * colour, which is the only way to get coloured text *inside* an embed body.
 */
export function callout(text, colour = "violet") {
  const CODES = { violet: "35", green: "32", yellow: "33", red: "31", blue: "34", grey: "30" };
  const c = CODES[colour] ?? "35";
  const ESC = "";
  return "```ansi\n" + `${ESC}[1;${c}m${text}${ESC}[0m` + "\n```";
}

/** Build a 3-column inline grid, padding the last row so it stays aligned. */
export function grid(items) {
  const fields = items.slice(0, 9).map((it) => ({
    name: `${it.glyph ?? GLYPH.muted} ${it.name}`.slice(0, 40),
    value: String(it.value).slice(0, 300),
    inline: true,
  }));
  while (fields.length % 3 !== 0 && fields.length > 3) {
    fields.push({ name: ZWSP, value: ZWSP, inline: true });
  }
  return fields;
}

// ── Attachments ─────────────────────────────────────────────────────────────

/** Generate the banner for a tone; returns the attachment + its embed URL. */
export function bannerFor(tone = "accent", { rule = false } = {}) {
  const colour = TONE[tone] ?? FORGET.accent;
  const buf = rule ? gradientRule(colour) : banner(colour);
  const name = rule ? "forget-rule.png" : "forget-banner.png";
  return { file: new AttachmentBuilder(buf, { name }), url: `attachment://${name}` };
}

// ── Core builders ───────────────────────────────────────────────────────────

/**
 * The base every Forget embed starts from. The author row (not the title) is
 * the brand anchor, which leaves the title free to carry the actual message.
 */
export function forgetEmbed(client, tone = "accent") {
  const embed = new EmbedBuilder().setColor(TONE[tone] ?? FORGET.accent).setTimestamp();
  const icon = client?.user?.displayAvatarURL?.({ size: 128 });
  embed.setAuthor({ name: `${FORGET.name} · ${FORGET.tagline}`, ...(icon ? { iconURL: icon } : {}) });
  return embed;
}

function toneToColour(tone) {
  return (
    { accent: "violet", success: "green", warning: "yellow", danger: "red", info: "blue", muted: "grey" }[
      tone
    ] ?? "violet"
  );
}

/**
 * Compose a finished embed from AI (or fallback) copy.
 * Returns { embeds, files } ready to spread into a send()/reply().
 */
export function composeEmbed(
  client,
  copy,
  { tone = "accent", thumbnail, withBanner = true, footerNote } = {}
) {
  const glyph = GLYPH[tone] ?? GLYPH.accent;
  const embed = forgetEmbed(client, tone).setTitle(`${glyph}  ${copy.title}`);

  // Body: lead paragraph, optional coloured callout, then a subtext caption.
  const parts = [copy.description];
  if (copy.highlight) parts.push(callout(copy.highlight, toneToColour(tone)));
  if (copy.caption) parts.push(subtext(copy.caption));
  embed.setDescription(parts.join("\n\n").slice(0, 4096));

  if (copy.fields?.length) {
    embed.addFields(grid(copy.fields.map((f) => ({ ...f, glyph }))));
  }
  if (thumbnail) embed.setThumbnail(thumbnail);

  const files = [];
  if (withBanner) {
    const b = bannerFor(tone);
    embed.setImage(b.url);
    files.push(b.file);
  }

  const foot = [copy.footer, footerNote, copy.source === "offline" ? "offline mode" : null]
    .filter(Boolean)
    .join("  ·  ");
  if (foot) embed.setFooter({ text: foot.slice(0, 2048) });

  return { embeds: [embed], files };
}

// ── Status embeds (Forget talking about itself) ─────────────────────────────
const status = (client, tone, glyph, title, description) =>
  forgetEmbed(client, tone).setTitle(`${glyph}  ${title}`).setDescription(description);

export const successEmbed = (c, t, d) => status(c, "success", "✦", t, d);
export const errorEmbed = (c, t, d) => status(c, "danger", "■", t, d);
export const infoEmbed = (c, t, d) => status(c, "info", "◇", t, d);

export const EPHEMERAL = { flags: 64 };

export async function replyError(interaction, title, description) {
  const payload = { embeds: [errorEmbed(interaction.client, title, description)], flags: 64 };
  return interaction.deferred || interaction.replied
    ? interaction.editReply(payload)
    : interaction.reply(payload);
}

/**
 * A readable report of where Forget decided to post and why. Scores render as
 * a bar so the ranking is scannable without reading numbers.
 */
export function detectionEmbed(client, ranked, chosen) {
  const tone = chosen ? "success" : "warning";
  const embed = forgetEmbed(client, tone).setTitle(
    chosen ? "✦  Staff channel identified" : "▲  No confident staff channel"
  );

  const lead = chosen
    ? `I'll post staff embeds in ${chosen.channel}.`
    : "Nothing scored high enough to be sure — so I won't guess.";
  const hint = chosen
    ? subtext("Override any time with /forget channel")
    : subtext("Pick one with /forget channel, or rename your staff channel");

  embed.setDescription([lead, "", hint].join("\n"));

  if (ranked.length) {
    const max = Math.max(...ranked.map((r) => r.score));
    const rows = ranked.slice(0, 6).map((r) => {
      const filled = Math.max(1, Math.round((r.score / max) * 8));
      const bar = "█".repeat(filled) + "░".repeat(8 - filled);
      const mark = r.channel === chosen?.channel ? "◆" : GLYPH.muted;
      return `${mark} \`${bar}\` ${r.channel}\n${subtext(r.reasons[0] ?? "weak signal")}`;
    });
    embed.addFields({ name: "Candidates", value: rows.join("\n").slice(0, 1024) });
  } else {
    embed.addFields({
      name: "Candidates",
      value: subtext("No channels I can post in scored above zero."),
    });
  }

  const b = bannerFor(tone, { rule: true });
  embed.setImage(b.url);
  return { embeds: [embed], files: [b.file] };
}
