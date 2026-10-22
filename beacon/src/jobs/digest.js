import { isSetupComplete, nowIso } from "../lib/store.js";
import { tagLabel } from "../lib/tags.js";
import { pageUrl } from "../lib/urls.js";
import { brandEmbed, BRAND } from "../lib/embeds.js";

const SIX_DAYS = 6 * 86_400_000;

/** The weekly digest embed — also used by tests, so it takes plain inputs. */
export function buildDigestEmbed({ row, store, directory, config }) {
  const hits = store.getHits(row.guild_id, 7);
  const uses = store.inviteUsesDelta(row.guild_id, 7);
  const latest = store.latestSample(row.guild_id);
  const growth = store.growth(row.guild_id, 7);
  const rank = row.published && row.tags[0] ? directory.rankOf(row.guild_id, row.tags[0]) : null;

  const lines = [
    `**${hits.views}** page views`,
    `**${hits.clicks}** join clicks`,
    uses !== null ? `**${uses}** invite uses` : null,
    latest ? `**${growth >= 0 ? "+" : ""}${growth}** members (${latest.members.toLocaleString("en-US")} total)` : null,
    rank ? `Ranked **#${rank.rank}** of ${rank.of} in ${tagLabel(row.tags[0])}` : row.published ? null : "Not listed — run `/beacon publish`",
  ].filter(Boolean);

  return brandEmbed(BRAND.primary)
    .setTitle(`This week on Beacon — ${row.name}`)
    .setURL(pageUrl(config, row))
    .setDescription(lines.join("\n"))
    .addFields({ name: "Your page", value: pageUrl(config, row) });
}

/** Hourly: post digests when it's the configured Monday hour (UTC). */
export async function runDigestJob(client) {
  const { store, directory, config } = client.beacon;
  const now = new Date();
  if (now.getUTCDay() !== 1 || now.getUTCHours() !== config.digestHourUtc) return;

  let sent = 0;
  for (const row of store.listAll()) {
    if (!row.digestEnabled || !row.digest_channel_id || !isSetupComplete(row)) continue;
    if (row.last_digest_at && Date.now() - Date.parse(row.last_digest_at) < SIX_DAYS) continue;

    const guild = client.guilds.cache.get(row.guild_id);
    if (!guild) continue;
    const channel = guild.channels.cache.get(row.digest_channel_id) ?? (await guild.channels.fetch(row.digest_channel_id).catch(() => null));
    if (!channel?.isTextBased?.()) continue;

    try {
      await channel.send({ embeds: [buildDigestEmbed({ row, store, directory, config })] });
      store.updateGuild(row.guild_id, { last_digest_at: nowIso() });
      sent++;
    } catch (err) {
      console.warn(`[DIGEST] ${row.name} (${row.guild_id}): ${err.message}`);
    }
  }
  if (sent) console.log(`[DIGEST] Sent ${sent} weekly digest(s)`);
}
