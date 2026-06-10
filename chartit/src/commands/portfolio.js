import { SlashCommandBuilder } from "discord.js";
import { Users } from "../lib/user-store.js";
import { normalizeSymbol } from "../lib/symbols.js";
import { getQuotes } from "../lib/market.js";
import {
  brandEmbed,
  successEmbed,
  changeColor,
  formatChange,
  formatNumber,
  replyError,
  liveChartRow,
  EPHEMERAL,
} from "../lib/embeds.js";

const MAX_SYMBOLS = 15;

/** A user's personal portfolio symbols (array), stored per user. */
function getPortfolio(userId) {
  const p = Users.getKey(userId, "portfolio");
  return Array.isArray(p) ? p : [];
}

export default {
  data: new SlashCommandBuilder()
    .setName("portfolio")
    .setDescription("Your personal watchlist — track tickers and see them at a glance")
    .addSubcommand((s) =>
      s.setName("add").setDescription("Add a ticker to your portfolio")
        .addStringOption((o) => o.setName("symbol").setDescription("e.g. AAPL or BTC-USD").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Remove a ticker from your portfolio")
        .addStringOption((o) => o.setName("symbol").setDescription("Ticker to remove").setRequired(true))
    )
    .addSubcommand((s) => s.setName("show").setDescription("Show your portfolio with live prices"))
    .addSubcommand((s) => s.setName("clear").setDescription("Remove every ticker from your portfolio")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const symbols = getPortfolio(userId);

    if (sub === "add") {
      const symbol = normalizeSymbol(interaction.options.getString("symbol"));
      if (!symbol) return replyError(interaction, "Invalid ticker", "Try something like **AAPL** or **BTC-USD**.");
      if (symbols.includes(symbol)) {
        return replyError(interaction, "Already tracking", `**${symbol}** is already in your portfolio.`);
      }
      if (symbols.length >= MAX_SYMBOLS) {
        return replyError(interaction, "Portfolio full", `You can track up to **${MAX_SYMBOLS}** tickers. Remove one first.`);
      }
      symbols.push(symbol);
      Users.merge(userId, { portfolio: symbols });
      return interaction.reply({
        embeds: [successEmbed("Added", `**${symbol}** is now in your portfolio. See it with \`/portfolio show\`.`)],
        ...EPHEMERAL,
      });
    }

    if (sub === "remove") {
      const symbol = normalizeSymbol(interaction.options.getString("symbol"));
      if (!symbol || !symbols.includes(symbol)) {
        return replyError(interaction, "Not in your portfolio", `**${symbol ?? "That ticker"}** isn't tracked.`);
      }
      Users.merge(userId, { portfolio: symbols.filter((s) => s !== symbol) });
      return interaction.reply({ embeds: [successEmbed("Removed", `Stopped tracking **${symbol}**.`)], ...EPHEMERAL });
    }

    if (sub === "clear") {
      if (symbols.length === 0) {
        return replyError(interaction, "Nothing to clear", "Your portfolio is already empty.");
      }
      Users.merge(userId, { portfolio: [] });
      return interaction.reply({ embeds: [successEmbed("Cleared", "Removed every ticker from your portfolio.")], ...EPHEMERAL });
    }

    // show
    if (symbols.length === 0) {
      return interaction.reply({
        embeds: [brandEmbed().setTitle("📁 Your portfolio").setDescription("*Empty — add a ticker with `/portfolio add`.*")],
        ...EPHEMERAL,
      });
    }

    await interaction.deferReply();
    const quotes = await getQuotes(symbols);

    // Build a row per symbol; sort the ones we got by % change (best first),
    // and list any we couldn't price at the bottom.
    const priced = [];
    const missing = [];
    for (const sym of symbols) {
      const q = quotes.get(sym);
      if (q && q.price != null) priced.push({ sym, q });
      else missing.push(sym);
    }
    priced.sort((a, b) => (b.q.changePercent ?? -Infinity) - (a.q.changePercent ?? -Infinity));

    if (priced.length === 0) {
      return replyError(
        interaction,
        "Couldn't load your portfolio",
        "The market data source didn't return quotes just now — it may be briefly rate-limited. Try again in a minute."
      );
    }

    const lines = priced.map(({ sym, q }) => {
      const cur = q.currency || "USD";
      return `**${sym}** — ${formatNumber(q.price)} ${cur}  ${formatChange(q.change ?? 0, q.changePercent)}`;
    });
    if (missing.length) lines.push(`*No data: ${missing.join(", ")}*`);

    // Colour the embed by the portfolio's average move (green if mostly up).
    const avg =
      priced.reduce((sum, { q }) => sum + (q.changePercent ?? 0), 0) / priced.length;

    const embed = brandEmbed(changeColor(avg))
      .setTitle(`📁 ${interaction.user.username}'s portfolio`)
      .setDescription(lines.join("\n"));

    return interaction.editReply({
      embeds: [embed],
      components: [liveChartRow(priced[0].sym)],
    });
  },
};
