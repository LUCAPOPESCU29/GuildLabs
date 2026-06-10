import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// Public site that renders the full interactive (zoom/pan, live-refreshing)
// candlestick chart. Override with SITE_URL in prod if the domain changes.
const SITE_URL = (process.env.SITE_URL || "https://www.guildlabs.fun").replace(/\/$/, "");

// ── Brand tokens ────────────────────────────────────────────────────────────
export const BRAND = {
  name: "ChartIt",
  primary: 0x16c784, // chart green — neutral/brand
  up: 0x16c784,      // green — price up
  down: 0xea3943,    // red — price down
  flat: 0x8a939b,    // grey — unchanged
  warning: 0xfee75c, // yellow
  danger: 0xed4245,  // red
};

// Every embed carries the not-financial-advice disclaimer.
// Display host for branding (e.g. "guildlabs.fun"), derived from SITE_URL.
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/^www\./, "");

// Every embed carries ChartIt branding + the not-financial-advice disclaimer,
// so any screenshot/repost of a command output points back to the product.
const FOOTER = {
  text: `📈 Made with ChartIt · ${SITE_HOST} · informational only, not financial advice`,
};

/** The shared footer object — exported for renderers that build embeds directly. */
export function shareFooter() {
  return { ...FOOTER };
}

// ── Embed helpers ───────────────────────────────────────────────────────────
export function brandEmbed(color = BRAND.primary) {
  return new EmbedBuilder().setColor(color).setFooter(FOOTER).setTimestamp();
}

export function successEmbed(title, description) {
  return brandEmbed(BRAND.up).setTitle(`✅ ${title}`).setDescription(description);
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

// ── Link to the live, interactive web chart ──────────────────────────────────

/** Public URL for a symbol's interactive chart on the GuildLabs site. */
export function liveChartUrl(symbol, range) {
  const path = `/c/${encodeURIComponent(symbol)}`;
  return range ? `${SITE_URL}${path}?range=${encodeURIComponent(range)}` : `${SITE_URL}${path}`;
}

/**
 * An action row with a single link button to the interactive web chart.
 * Link buttons are URL redirects — no component handler needed.
 */
export function liveChartRow(symbol, range) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("View live chart")
      .setStyle(ButtonStyle.Link)
      .setEmoji("📈")
      .setURL(liveChartUrl(symbol, range))
  );
}

/**
 * A link button back to the GuildLabs site, for outputs without a single
 * symbol target (e.g. the market heatmap). Links to a path on the site, or the
 * site root when none is given.
 */
export function madeWithRow(path = "/") {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Made with ChartIt")
      .setStyle(ButtonStyle.Link)
      .setEmoji("📈")
      .setURL(url)
  );
}

// ── Common reply patterns ───────────────────────────────────────────────────
export const EPHEMERAL = { flags: 64 };

export async function replyError(interaction, title, description) {
  const embed = errorEmbed(title, description);
  const payload = { embeds: [embed], flags: 64 };
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

// ── Formatting helpers ──────────────────────────────────────────────────────

/** Pick an embed color from a change (positive=green, negative=red, 0=grey). */
export function changeColor(change) {
  if (change > 0) return BRAND.up;
  if (change < 0) return BRAND.down;
  return BRAND.flat;
}

/** "▲ +1.23 (+0.45%)" / "▼ -1.23 (-0.45%)" — sign-aware, with an arrow. */
export function formatChange(change, changePercent) {
  const arrow = change > 0 ? "▲" : change < 0 ? "▼" : "▬";
  const sign = change > 0 ? "+" : "";
  const pct =
    changePercent === null || changePercent === undefined
      ? ""
      : ` (${sign}${changePercent.toFixed(2)}%)`;
  return `${arrow} ${sign}${formatNumber(change)}${pct}`;
}

/** Compact money/number formatting that handles crypto's many decimals. */
export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs !== 0 && abs < 1) return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Human-readable large numbers: 1.2M, 3.4B (used for volume). */
export function formatCompact(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}
