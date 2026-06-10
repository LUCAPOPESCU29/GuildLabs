import { SlashCommandBuilder } from "discord.js";
import { normalizeSymbol } from "../lib/symbols.js";
import { getNews } from "../lib/market.js";
import { brandEmbed, infoEmbed, replyError } from "../lib/embeds.js";

/**
 * Render up to `max` headlines as Discord markdown lines:
 *   • [Title](link) — Publisher · <relative time>
 * Shared by /news and the /chart enrichment so both read identically.
 */
export function formatHeadlines(items, max = 3) {
  return items
    .slice(0, max)
    .map((n) => {
      const when = n.publishedAt ? ` · <t:${Math.floor(n.publishedAt / 1000)}:R>` : "";
      const pub = n.publisher ? ` — ${n.publisher}` : "";
      // Titles can contain ] which breaks markdown links; strip brackets.
      const title = n.title.replace(/[[\]]/g, "");
      return `• [${title}](${n.link})${pub}${when}`;
    })
    .join("\n");
}

export default {
  data: new SlashCommandBuilder()
    .setName("news")
    .setDescription("Latest headlines for a stock or crypto ticker")
    .addStringOption((o) =>
      o.setName("symbol")
        .setDescription("Ticker — e.g. AAPL, MSFT, BTC-USD")
        .setRequired(true)
    ),

  async execute(interaction) {
    const raw = interaction.options.getString("symbol");
    const symbol = normalizeSymbol(raw);
    if (!symbol) {
      return replyError(
        interaction,
        "That doesn't look like a ticker",
        `\`${raw}\` isn't a valid symbol. Try **AAPL**, **MSFT**, or **BTC-USD**.`
      );
    }

    await interaction.deferReply();

    const items = await getNews(symbol, 3);
    if (items.length === 0) {
      return interaction.editReply({
        embeds: [infoEmbed(`📰 ${symbol}`, "*No recent headlines found for that ticker right now.*")],
      });
    }

    const embed = brandEmbed()
      .setTitle(`📰 Latest on ${symbol}`)
      .setDescription(formatHeadlines(items, 3));

    return interaction.editReply({ embeds: [embed] });
  },
};
