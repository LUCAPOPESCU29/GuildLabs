import { SlashCommandBuilder } from "discord.js";
import { normalizeSymbol } from "../lib/symbols.js";
import { getQuote } from "../lib/market.js";
import {
  brandEmbed,
  changeColor,
  formatChange,
  formatNumber,
  formatCompact,
  replyError,
  liveChartRow,
} from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Get a fast text quote for a stock or crypto ticker")
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

    let quote;
    try {
      quote = await getQuote(symbol);
    } catch (err) {
      return replyError(interaction, "Couldn't fetch that quote", err.message);
    }

    const cur = quote.currency || "USD";
    const embed = brandEmbed(changeColor(quote.change ?? 0))
      .setTitle(`${quote.name} (${quote.symbol})`)
      .setDescription(`**${formatNumber(quote.price)} ${cur}**  ${formatChange(quote.change ?? 0, quote.changePercent)}`);

    const fields = [];
    if (quote.dayLow != null && quote.dayHigh != null) {
      fields.push({ name: "Day range", value: `${formatNumber(quote.dayLow)} – ${formatNumber(quote.dayHigh)}`, inline: true });
    }
    if (quote.volume != null) fields.push({ name: "Volume", value: formatCompact(quote.volume), inline: true });
    if (quote.exchange) fields.push({ name: "Exchange", value: String(quote.exchange), inline: true });
    if (fields.length) embed.addFields(...fields);

    return interaction.editReply({
      embeds: [embed],
      components: [liveChartRow(quote.symbol)],
    });
  },
};
