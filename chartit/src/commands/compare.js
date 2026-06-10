import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { normalizeSymbolList } from "../lib/symbols.js";
import { getHistory, RANGES, DEFAULT_RANGE } from "../lib/market.js";
import { buildCompareImage, COMPARE_COLORS } from "../lib/compare-chart.js";
import { brandEmbed, replyError, liveChartRow } from "../lib/embeds.js";

const MIN_SYMBOLS = 2;
const MAX_SYMBOLS = 5;

export default {
  data: new SlashCommandBuilder()
    .setName("compare")
    .setDescription("Overlay 2–5 tickers on one normalized % change chart")
    .addStringOption((o) =>
      o.setName("symbols")
        .setDescription("Tickers separated by spaces or commas — e.g. AAPL TSLA NVDA")
        .setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("range")
        .setDescription("Time range (default 1 month)")
        .setRequired(false)
        .addChoices(...Object.entries(RANGES).map(([value, cfg]) => ({ name: cfg.label, value })))
    ),

  async execute(interaction) {
    const raw = interaction.options.getString("symbols");
    const range = interaction.options.getString("range") ?? DEFAULT_RANGE;
    const symbols = normalizeSymbolList(raw, MAX_SYMBOLS);

    if (symbols.length < MIN_SYMBOLS) {
      return replyError(
        interaction,
        "Need at least two tickers",
        `Give me ${MIN_SYMBOLS}–${MAX_SYMBOLS} symbols to compare, e.g. \`/compare symbols:AAPL TSLA NVDA\`.`
      );
    }

    await interaction.deferReply();

    // Fetch each symbol's history independently; tolerate individual failures.
    const results = await Promise.all(
      symbols.map((symbol) =>
        getHistory(symbol, range)
          .then((hist) => ({ symbol, points: hist.points }))
          .catch((err) => {
            console.error(`[COMPARE] history ${symbol} ${range}:`, err.message);
            return null;
          })
      )
    );

    const ok = results.filter(Boolean);
    if (ok.length < MIN_SYMBOLS) {
      return replyError(
        interaction,
        "Couldn't compare those",
        "I could only get data for fewer than two of those tickers. Double-check the symbols (e.g. **AAPL**, **MSFT**, **BTC-USD**) and try again."
      );
    }

    const series = ok.map((s, i) => ({ ...s, color: COMPARE_COLORS[i % COMPARE_COLORS.length] }));

    let png, finals;
    try {
      ({ png, finals } = await buildCompareImage(series, { rangeLabel: RANGES[range]?.label ?? range }));
    } catch (err) {
      return replyError(interaction, "Couldn't build that comparison", err.message);
    }

    // Embed lists each symbol's return, colour-dotted to match its line.
    const lines = finals.map(({ symbol, finalPct }) => {
      if (finalPct == null) return `**${symbol}** — —`;
      const arrow = finalPct > 0 ? "▲" : finalPct < 0 ? "▼" : "▬";
      const sign = finalPct > 0 ? "+" : "";
      return `**${symbol}** — ${arrow} ${sign}${finalPct.toFixed(2)}%`;
    });

    const embed = brandEmbed()
      .setTitle(`📊 ${finals.map((f) => f.symbol).join(" vs ")}`)
      .setDescription(`Normalized to **% change** over **${RANGES[range]?.label ?? range}**.\n\n${lines.join("\n")}`)
      .setImage("attachment://compare.png");

    const file = new AttachmentBuilder(png, { name: "compare.png" });
    return interaction.editReply({
      embeds: [embed],
      files: [file],
      components: [liveChartRow(finals[0].symbol, range)],
    });
  },
};
