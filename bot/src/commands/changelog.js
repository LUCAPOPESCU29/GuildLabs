/**
 * /changelog — what's new in Construct.
 *
 * A pull, not a push: owners ask for the update rather than being DM'd it.
 * Entries come from the site's /api/changelog so the bot and guildlabs.fun
 * never drift apart.
 */

import { SlashCommandBuilder } from "discord.js";
import { brandEmbed, BRAND, EPHEMERAL, replyError } from "../lib/embeds.js";

const SITE = (process.env.SITE_URL || "https://www.guildlabs.fun").replace(/\/+$/, "");
const TYPE_GLYPH = { added: "✦", improved: "→", fixed: "✓" };

/** Cache so repeated calls across a busy guild don't hammer the site. */
let cache = { at: 0, entries: null };
const TTL_MS = 5 * 60_000;

async function fetchEntries() {
  if (cache.entries && Date.now() - cache.at < TTL_MS) return cache.entries;
  const res = await fetch(`${SITE}/api/changelog?bot=Construct&limit=3`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`site responded ${res.status}`);
  const json = await res.json();
  cache = { at: Date.now(), entries: json.entries ?? [] };
  return cache.entries;
}

function renderEntry(entry, isLatest) {
  const embed = brandEmbed(isLatest ? BRAND.primary : BRAND.muted)
    .setTitle(entry.title)
    .setURL(`${SITE}/changelog`)
    .setDescription(entry.summary.slice(0, 1500));

  const lines = (entry.items ?? [])
    .slice(0, 8)
    .map((i) => `${TYPE_GLYPH[i.type] ?? "·"} ${i.text}`)
    .join("\n");
  if (lines) embed.addFields({ name: "​", value: lines.slice(0, 1024) });

  embed.setFooter({ text: `${entry.bot} · ${entry.date}` });
  return embed;
}

export default {
  data: new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("See what's new in Construct"),

  async execute(interaction) {
    await interaction.deferReply(EPHEMERAL);
    try {
      const entries = await fetchEntries();
      if (!entries.length) {
        return replyError(interaction, "Nothing to show", "No changelog entries were returned.");
      }
      return interaction.editReply({
        content: `Latest updates — full history at ${SITE}/changelog`,
        embeds: entries.map((e, i) => renderEntry(e, i === 0)),
      });
    } catch (err) {
      console.error("[changelog]", err.message);
      return replyError(
        interaction,
        "Couldn't load the changelog",
        `Try again shortly, or read it at ${SITE}/changelog`
      );
    }
  },
};
