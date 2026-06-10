import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { normalizeSymbol } from "../lib/symbols.js";
import { getQuote, getHistory, getNews, RANGES, DEFAULT_RANGE } from "../lib/market.js";
import { buildChartImage } from "../lib/chart.js";
import { formatHeadlines } from "./news.js";
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
    .setName("chart")
    .setDescription("Post a price chart for a stock or crypto ticker")
    .addStringOption((o) =>
      o.setName("symbol")
        .setDescription("Ticker — e.g. AAPL, MSFT, BTC-USD")
        .setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("range")
        .setDescription("Time range (default 1 month)")
        .setRequired(false)
        .addChoices(
          ...Object.entries(RANGES).map(([value, cfg]) => ({ name: cfg.label, value }))
        )
    ),

  async execute(interaction) {
    const raw = interaction.options.getString("symbol");
    const range = interaction.options.getString("range") ?? DEFAULT_RANGE;
    const symbol = normalizeSymbol(raw);

    if (!symbol) {
      return replyError(
        interaction,
        "That doesn't look like a ticker",
        `\`${raw}\` isn't a valid symbol. Try something like **AAPL**, **MSFT**, or **BTC-USD**.`
      );
    }

    await interaction.deferReply();

    // Kick off news in parallel — it never throws (returns [] on failure), so
    // it can't slow or break the chart; we just await it after the render.
    const newsPromise = getNews(symbol, 3);

    let quote, history, chartPng;
    try {
      [quote, history] = await Promise.all([
        getQuote(symbol),
        getHistory(symbol, range),
      ]);
      chartPng = await buildChartImage(history.points, history.meta);
    } catch (err) {
      return replyError(interaction, "Couldn't build that chart", err.message);
    }

    const cur = quote.currency || history.meta.currency || "USD";
    const embed = brandEmbed(changeColor(quote.change ?? 0))
      .setTitle(`${quote.name} (${quote.symbol})`)
      .setImage("attachment://chart.png")
      .addFields(
        { name: "Price", value: `${formatNumber(quote.price)} ${cur}`, inline: true },
        { name: "Change", value: formatChange(quote.change ?? 0, quote.changePercent), inline: true },
        { name: "Range", value: history.meta.rangeLabel, inline: true },
      );

    if (quote.dayLow != null && quote.dayHigh != null) {
      embed.addFields({
        name: "Day range",
        value: `${formatNumber(quote.dayLow)} – ${formatNumber(quote.dayHigh)}`,
        inline: true,
      });
    }
    if (quote.volume != null) {
      embed.addFields({ name: "Volume", value: formatCompact(quote.volume), inline: true });
    }
    if (quote.marketState) {
      embed.addFields({ name: "Market", value: prettyState(quote.marketState), inline: true });
    }

    // Append recent headlines if any came back (non-blocking, best-effort).
    const headlines = await newsPromise;
    if (headlines.length) {
      embed.addFields({ name: "📰 Latest headlines", value: formatHeadlines(headlines, 3) });
    }

    const file = new AttachmentBuilder(chartPng, { name: "chart.png" });
    return interaction.editReply({
      embeds: [embed],
      files: [file],
      components: [liveChartRow(quote.symbol, range)],
    });
  },
};

function prettyState(state) {
  const map = {
    REGULAR: "🟢 Open",
    CLOSED: "🔴 Closed",
    PRE: "🌅 Pre-market",
    PREPRE: "🌅 Pre-market",
    POST: "🌆 After-hours",
    POSTPOST: "🌆 After-hours",
  };
  return map[state] ?? state;
}
