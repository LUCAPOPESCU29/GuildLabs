import { SlashCommandBuilder } from "discord.js";
import { brandEmbed, EPHEMERAL } from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("chartit")
    .setDescription("How to use ChartIt"),

  async execute(interaction) {
    const embed = brandEmbed()
      .setTitle("📈 ChartIt")
      .setDescription("Live stock & crypto charts, straight from Yahoo Finance.")
      .addFields(
        {
          name: "On demand",
          value:
            "`/chart symbol:AAPL range:1mo` — a chart with price, change & volume\n" +
            "`/quote symbol:BTC-USD` — a fast text quote",
          inline: false,
        },
        {
          name: "Live auto-posts (admin)",
          value:
            "`/watchlist add symbol:AAPL` — add a ticker\n" +
            "`/watchlist channel #markets` — where charts post\n" +
            "`/watchlist interval minutes:60` · `/watchlist range 1d` · `/watchlist hours market`\n" +
            "`/watchlist list` — see everything",
          inline: false,
        },
        {
          name: "Price alerts (admin)",
          value:
            "`/alert add symbol:TSLA direction:above price:250`\n" +
            "`/alert list` · `/alert remove id:1`",
          inline: false,
        },
        {
          name: "Symbols",
          value: "Stocks/ETFs (`AAPL`, `SPY`), crypto (`BTC-USD`, `ETH-USD`), indices (`^GSPC`).",
          inline: false,
        },
      );
    return interaction.reply({ embeds: [embed], ...EPHEMERAL });
  },
};
