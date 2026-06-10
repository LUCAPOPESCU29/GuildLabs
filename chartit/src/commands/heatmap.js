import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getQuotes } from "../lib/market.js";
import { MARKETS } from "../lib/heatmap-symbols.js";
import { buildHeatmapImage } from "../lib/heatmap.js";
import { brandEmbed, replyError, madeWithRow } from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("heatmap")
    .setDescription("Post a colorful market heatmap of daily % change")
    .addStringOption((o) =>
      o.setName("market")
        .setDescription("Which market (default stocks)")
        .setRequired(false)
        .addChoices(
          { name: "Stocks", value: "stocks" },
          { name: "Crypto", value: "crypto" },
        )
    ),

  async execute(interaction) {
    const key = interaction.options.getString("market") ?? "stocks";
    const market = MARKETS[key] ?? MARKETS.stocks;

    await interaction.deferReply();

    // One batched fetch for the whole curated list.
    const quotes = await getQuotes(market.symbols);
    const tiles = market.symbols
      .map((symbol) => {
        const q = quotes.get(symbol);
        return q ? { symbol, changePercent: q.changePercent ?? null } : null;
      })
      .filter(Boolean);

    if (tiles.length === 0) {
      return replyError(
        interaction,
        "Couldn't build the heatmap",
        "The market data source didn't return any quotes just now — it may be briefly rate-limited. Try again in a minute."
      );
    }

    let png;
    try {
      png = await buildHeatmapImage(tiles, { title: market.label });
    } catch (err) {
      return replyError(interaction, "Couldn't render the heatmap", err.message);
    }

    const gainers = tiles.filter((t) => (t.changePercent ?? 0) > 0).length;
    const embed = brandEmbed()
      .setTitle(`📊 Market heatmap — ${market.label}`)
      .setDescription(`${gainers}/${tiles.length} up on the day · daily % change`)
      .setImage("attachment://heatmap.png");

    const file = new AttachmentBuilder(png, { name: "heatmap.png" });
    return interaction.editReply({
      embeds: [embed],
      files: [file],
      components: [madeWithRow("/")],
    });
  },
};
