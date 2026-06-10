import { AttachmentBuilder } from "discord.js";
import { Config } from "../lib/config-store.js";
import { getWatchlist } from "../commands/watchlist.js";
import { getQuote, getHistory } from "../lib/market.js";
import { buildChartImage } from "../lib/chart.js";
import { isUsMarketOpen, isAlwaysOpen } from "../lib/market-hours.js";
import {
  brandEmbed,
  changeColor,
  formatChange,
  formatNumber,
  formatCompact,
} from "../lib/embeds.js";

// In-memory record of the last auto-post per guild. Initialized to "now" the
// first time we see a guild, so the first post lands one full interval later
// (avoids re-spamming on every restart/deploy).
const lastPosted = new Map();

export async function runWatchlistTick(client) {
  const now = Date.now();

  for (const guildId of Config.allGuildIds()) {
    const wl = getWatchlist(guildId);
    if (!wl.channelId || wl.symbols.length === 0) continue;

    if (!lastPosted.has(guildId)) {
      lastPosted.set(guildId, now);
      continue;
    }
    const dueAt = lastPosted.get(guildId) + wl.intervalMin * 60_000;
    if (now < dueAt) continue;

    // Decide which symbols are eligible right now.
    const marketOpen = isUsMarketOpen();
    const symbols = wl.marketHoursOnly && !marketOpen
      ? wl.symbols.filter(isAlwaysOpen) // only 24/7 instruments when market closed
      : wl.symbols;

    if (symbols.length === 0) {
      // Nothing to post this cycle; re-check next interval.
      lastPosted.set(guildId, now);
      continue;
    }

    const channel = await client.channels.fetch(wl.channelId).catch(() => null);
    if (!channel || !channel.isTextBased?.()) {
      lastPosted.set(guildId, now);
      continue;
    }

    for (const symbol of symbols) {
      try {
        const [quote, history] = await Promise.all([
          getQuote(symbol),
          getHistory(symbol, wl.range),
        ]);
        const chartPng = await buildChartImage(history.points, history.meta);
        const cur = quote.currency || history.meta.currency || "USD";

        const embed = brandEmbed(changeColor(quote.change ?? 0))
          .setTitle(`${quote.name} (${quote.symbol})`)
          .setImage("attachment://chart.png")
          .addFields(
            { name: "Price", value: `${formatNumber(quote.price)} ${cur}`, inline: true },
            { name: "Change", value: formatChange(quote.change ?? 0, quote.changePercent), inline: true },
            { name: "Range", value: history.meta.rangeLabel, inline: true },
          );
        if (quote.volume != null) {
          embed.addFields({ name: "Volume", value: formatCompact(quote.volume), inline: true });
        }
        const file = new AttachmentBuilder(chartPng, { name: "chart.png" });
        await channel.send({ embeds: [embed], files: [file] });
      } catch (err) {
        console.error(`[WATCHLIST] ${guildId} ${symbol}:`, err.message);
      }
    }

    lastPosted.set(guildId, now);
  }
}
