import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { Config } from "../lib/config-store.js";
import { normalizeSymbol } from "../lib/symbols.js";
import { getQuote, RANGES } from "../lib/market.js";
import { brandEmbed, successEmbed, infoEmbed, replyError, EPHEMERAL } from "../lib/embeds.js";

const MIN_INTERVAL = 5;   // minutes — floor to stay gentle on Yahoo
const MAX_INTERVAL = 1440;
const MAX_SYMBOLS = 15;

export const WATCHLIST_DEFAULTS = {
  channelId: null,
  intervalMin: 60,
  range: "1d",
  marketHoursOnly: true,
  symbols: [],
};

export function getWatchlist(guildId) {
  return { ...WATCHLIST_DEFAULTS, ...(Config.getKey(guildId, "watchlist") ?? {}) };
}

export default {
  data: new SlashCommandBuilder()
    .setName("watchlist")
    .setDescription("Manage the auto-posting chart watchlist")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName("add").setDescription("Add a ticker to the watchlist")
        .addStringOption((o) => o.setName("symbol").setDescription("e.g. AAPL or BTC-USD").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Remove a ticker from the watchlist")
        .addStringOption((o) => o.setName("symbol").setDescription("Ticker to remove").setRequired(true))
    )
    .addSubcommand((s) => s.setName("list").setDescription("Show the current watchlist and settings"))
    .addSubcommand((s) =>
      s.setName("channel").setDescription("Set the channel charts auto-post to")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Target channel")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("interval").setDescription("How often charts auto-post")
        .addIntegerOption((o) =>
          o.setName("minutes").setDescription(`Minutes between posts (${MIN_INTERVAL}–${MAX_INTERVAL})`)
            .setMinValue(MIN_INTERVAL).setMaxValue(MAX_INTERVAL).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("range").setDescription("Chart time range used for auto-posts")
        .addStringOption((o) =>
          o.setName("range").setDescription("Time range").setRequired(true)
            .addChoices(...Object.entries(RANGES).map(([value, cfg]) => ({ name: cfg.label, value })))
        )
    )
    .addSubcommand((s) =>
      s.setName("hours").setDescription("Post only during US market hours, or always")
        .addStringOption((o) =>
          o.setName("mode").setDescription("When to post").setRequired(true)
            .addChoices(
              { name: "Market hours only", value: "market" },
              { name: "Always (24/7)", value: "all" },
            )
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const wl = getWatchlist(guildId);

    switch (sub) {
      case "add": {
        const symbol = normalizeSymbol(interaction.options.getString("symbol"));
        if (!symbol) return replyError(interaction, "Invalid ticker", "Try something like **AAPL** or **BTC-USD**.");
        if (wl.symbols.includes(symbol)) {
          return replyError(interaction, "Already watching", `**${symbol}** is already on the watchlist.`);
        }
        if (wl.symbols.length >= MAX_SYMBOLS) {
          return replyError(interaction, "Watchlist full", `You can watch up to **${MAX_SYMBOLS}** tickers. Remove one first.`);
        }
        // Validate it actually resolves before saving.
        try { await getQuote(symbol); }
        catch (err) { return replyError(interaction, "Couldn't verify that ticker", err.message); }

        wl.symbols.push(symbol);
        Config.merge(guildId, { watchlist: wl });
        return interaction.reply({
          embeds: [successEmbed("Added to watchlist", `Now watching **${symbol}**. ${wl.channelId ? "" : "\n\n⚠️ Set a channel with `/watchlist channel` so charts have somewhere to post."}`)],
          ...EPHEMERAL,
        });
      }

      case "remove": {
        const symbol = normalizeSymbol(interaction.options.getString("symbol"));
        if (!symbol || !wl.symbols.includes(symbol)) {
          return replyError(interaction, "Not on the watchlist", `**${symbol ?? "That ticker"}** isn't being watched.`);
        }
        wl.symbols = wl.symbols.filter((s) => s !== symbol);
        Config.merge(guildId, { watchlist: wl });
        return interaction.reply({ embeds: [successEmbed("Removed", `Stopped watching **${symbol}**.`)], ...EPHEMERAL });
      }

      case "channel": {
        const channel = interaction.options.getChannel("channel");
        wl.channelId = channel.id;
        Config.merge(guildId, { watchlist: wl });
        return interaction.reply({ embeds: [successEmbed("Auto-post channel set", `Charts will post to ${channel}.`)], ...EPHEMERAL });
      }

      case "interval": {
        wl.intervalMin = interaction.options.getInteger("minutes");
        Config.merge(guildId, { watchlist: wl });
        return interaction.reply({ embeds: [successEmbed("Interval updated", `Charts will auto-post every **${wl.intervalMin} min**.`)], ...EPHEMERAL });
      }

      case "range": {
        wl.range = interaction.options.getString("range");
        Config.merge(guildId, { watchlist: wl });
        return interaction.reply({ embeds: [successEmbed("Range updated", `Auto-posts will use the **${RANGES[wl.range].label}** range.`)], ...EPHEMERAL });
      }

      case "hours": {
        wl.marketHoursOnly = interaction.options.getString("mode") === "market";
        Config.merge(guildId, { watchlist: wl });
        return interaction.reply({
          embeds: [successEmbed("Schedule updated", wl.marketHoursOnly ? "Charts will only post during **US market hours** (crypto still posts 24/7)." : "Charts will post **around the clock**.")],
          ...EPHEMERAL,
        });
      }

      case "list": {
        const embed = brandEmbed()
          .setTitle("📋 Watchlist")
          .setDescription(wl.symbols.length ? wl.symbols.map((s) => `• **${s}**`).join("\n") : "*No tickers yet — add one with `/watchlist add`.*")
          .addFields(
            { name: "Channel", value: wl.channelId ? `<#${wl.channelId}>` : "*not set*", inline: true },
            { name: "Every", value: `${wl.intervalMin} min`, inline: true },
            { name: "Range", value: RANGES[wl.range]?.label ?? wl.range, inline: true },
            { name: "When", value: wl.marketHoursOnly ? "Market hours" : "24/7", inline: true },
          );
        return interaction.reply({ embeds: [embed], ...EPHEMERAL });
      }
    }
  },
};
