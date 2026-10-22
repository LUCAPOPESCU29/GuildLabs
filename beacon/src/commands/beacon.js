import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  InteractionContextType,
} from "discord.js";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { isSetupComplete } from "../lib/store.js";
import { validateSlug } from "../lib/slug.js";
import { tagLabel } from "../lib/tags.js";
import { guildVisuals, fetchCounts } from "../lib/discord-data.js";
import { pageUrl, bannerUrl, tagUrl } from "../lib/urls.js";
import { brandEmbed, BRAND, EPHEMERAL, replyError, replySuccess, replyEmbed } from "../lib/embeds.js";
import { buildSetupModal } from "../flows/setup.js";
import { buildRemovePrompt } from "../flows/remove.js";

const MAX_BANNER_BYTES = 2 * 1024 * 1024;
const BANNER_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export default {
  data: new SlashCommandBuilder()
    .setName("beacon")
    .setDescription("Give this server a public page and get found")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((s) => s.setName("setup").setDescription("Create or edit this server's public page (tagline, tags, invite)"))
    .addSubcommand((s) => s.setName("publish").setDescription("List this server in the directory"))
    .addSubcommand((s) => s.setName("unpublish").setDescription("Remove this server from the directory (page stays reachable by link)"))
    .addSubcommand((s) =>
      s.setName("slug")
        .setDescription("Customise the page link: /s/<slug>")
        .addStringOption((o) =>
          o.setName("slug").setDescription("3–32 lowercase letters, numbers, hyphens").setRequired(true).setMinLength(3).setMaxLength(32)
        )
    )
    .addSubcommand((s) =>
      s.setName("banner")
        .setDescription("Upload a banner image for the page (PNG/JPG/WebP, up to 2 MB)")
        .addAttachmentOption((o) => o.setName("image").setDescription("The banner image").setRequired(true))
    )
    .addSubcommand((s) => s.setName("preview").setDescription("See what the page looks like right now"))
    .addSubcommand((s) => s.setName("stats").setDescription("Views, join clicks, and directory rank"))
    .addSubcommand((s) =>
      s.setName("digest")
        .setDescription("Post a weekly stats digest to a channel")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Where to post it").addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true)
        )
        .addBooleanOption((o) => o.setName("enabled").setDescription("Turn the digest on or off").setRequired(true))
    )
    .addSubcommand((s) => s.setName("remove").setDescription("Delete this server's page and stats")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    switch (sub) {
      case "setup": return handleSetup(interaction);
      case "publish": return handlePublish(interaction);
      case "unpublish": return handleUnpublish(interaction);
      case "slug": return handleSlug(interaction);
      case "banner": return handleBanner(interaction);
      case "preview": return handlePreview(interaction);
      case "stats": return handleStats(interaction);
      case "digest": return handleDigest(interaction);
      case "remove": return handleRemove(interaction);
    }
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function ctx(interaction) {
  return interaction.client.beacon;
}

/** Make sure a row exists for this guild (the bot may predate the database). */
function ensureDraft(interaction) {
  const { store } = ctx(interaction);
  return store.upsertDraft({ guildId: interaction.guild.id, ...guildVisuals(interaction.guild) }).row;
}

async function requireSetup(interaction, row) {
  if (isSetupComplete(row)) return true;
  await replyError(
    interaction,
    "This server doesn't have a page yet",
    "Run **`/beacon setup`** first — it takes about a minute."
  );
  return false;
}

// ── Subcommands ─────────────────────────────────────────────────────────────

async function handleSetup(interaction) {
  const row = ensureDraft(interaction);
  return interaction.showModal(buildSetupModal(row));
}

async function handlePublish(interaction) {
  const { store, config, directory } = ctx(interaction);
  const row = ensureDraft(interaction);
  if (!(await requireSetup(interaction, row))) return;

  if (row.banned) {
    return replyError(
      interaction,
      "This server can't be listed",
      row.ban_reason ? `Reason: ${row.ban_reason}` : "It was removed from the directory by the instance admins."
    );
  }
  if (row.nsfw) {
    return replyError(
      interaction,
      "Age-restricted servers can't be listed",
      "Discord marks this server as age-restricted, so Beacon keeps it out of the public directory. The page still works by link."
    );
  }
  const updated = store.updateGuild(row.guild_id, { published: 1 });
  directory.invalidate();
  const tag = updated.tags[0];
  return replySuccess(
    interaction,
    "Listed in the directory",
    `${pageUrl(config, updated)}\n\nIt now appears under **${tagLabel(tag)}**: ${tagUrl(config, tag)}\n` +
      "Ranking is based on real activity — online ratio, growth, events — never bumping."
  );
}

async function handleUnpublish(interaction) {
  const { store, config, directory } = ctx(interaction);
  const row = ensureDraft(interaction);
  if (!(await requireSetup(interaction, row))) return;
  const updated = store.updateGuild(row.guild_id, { published: 0 });
  directory.invalidate();
  return replySuccess(
    interaction,
    "Removed from the directory",
    `The page is still reachable by link: ${pageUrl(config, updated)}\nRun **\`/beacon publish\`** to list it again.`
  );
}

async function handleSlug(interaction) {
  const { store, config, directory } = ctx(interaction);
  const row = ensureDraft(interaction);
  const slug = interaction.options.getString("slug").trim().toLowerCase();

  const check = validateSlug(slug);
  if (!check.ok) return replyError(interaction, "That slug won't work", check.error);
  if (store.isSlugTaken(slug, row.guild_id)) {
    return replyError(interaction, "That slug is taken", "Another server already uses it. Try a variation.");
  }
  const updated = store.updateGuild(row.guild_id, { slug });
  directory.invalidate();
  return replySuccess(interaction, "Link updated", `Your page now lives at:\n${pageUrl(config, updated)}`);
}

async function handleBanner(interaction) {
  const { store, config } = ctx(interaction);
  await interaction.deferReply(EPHEMERAL);
  const row = ensureDraft(interaction);

  const file = interaction.options.getAttachment("image");
  const ext = BANNER_TYPES[(file.contentType ?? "").split(";")[0]];
  if (!ext) {
    return replyError(interaction, "Unsupported image type", "Upload a PNG, JPG, or WebP.");
  }
  if (file.size > MAX_BANNER_BYTES) {
    return replyError(interaction, "That image is too large", "Banners must be 2 MB or smaller.");
  }

  let bytes;
  try {
    const res = await fetch(file.url);
    if (!res.ok) throw new Error(`download failed (HTTP ${res.status})`);
    bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_BANNER_BYTES) throw new Error("file exceeds 2 MB");
  } catch (err) {
    return replyError(interaction, "Couldn't read the image", `\`${err.message}\``);
  }

  const filename = `${row.guild_id}.${ext}`;
  await writeFile(join(config.dataDir, "uploads", filename), bytes);
  if (row.banner_path && row.banner_path !== filename) {
    await unlink(join(config.dataDir, "uploads", row.banner_path)).catch(() => {});
  }
  const updated = store.updateGuild(row.guild_id, { banner_path: filename });

  const embed = brandEmbed(BRAND.success)
    .setTitle("✅ Banner updated")
    .setDescription(isSetupComplete(updated) ? `Live at ${pageUrl(config, updated)}` : "It'll show once you finish **`/beacon setup`**.")
    .setImage(bannerUrl(config, updated));
  return replyEmbed(interaction, embed);
}

async function handlePreview(interaction) {
  const { store, config } = ctx(interaction);
  await interaction.deferReply(EPHEMERAL);
  const row = ensureDraft(interaction);
  if (!(await requireSetup(interaction, row))) return;

  const sample = store.latestSample(row.guild_id) ?? (await fetchCounts(interaction.client, row.guild_id).catch(() => null));
  const members = sample?.members ?? interaction.guild.memberCount ?? 0;
  const online = sample?.online ?? 0;

  const embed = brandEmbed(BRAND.primary)
    .setTitle(row.name)
    .setURL(pageUrl(config, row))
    .setDescription(`**${row.tagline}**${row.description ? `\n\n${row.description.slice(0, 700)}` : ""}`)
    .addFields(
      { name: "Members", value: members.toLocaleString("en-US"), inline: true },
      { name: "Online", value: online.toLocaleString("en-US"), inline: true },
      { name: "Tags", value: row.tags.map(tagLabel).join(" · ") || "—", inline: false },
      { name: "Status", value: row.published ? "Listed in the directory" : "Unlisted — reachable by link", inline: false }
    );
  if (row.icon_url) embed.setThumbnail(row.icon_url);
  const banner = bannerUrl(config, row);
  if (banner) embed.setImage(banner);
  return replyEmbed(interaction, embed);
}

async function handleStats(interaction) {
  const { store, config, directory } = ctx(interaction);
  await interaction.deferReply(EPHEMERAL);
  const row = ensureDraft(interaction);
  if (!(await requireSetup(interaction, row))) return;

  const h7 = store.getHits(row.guild_id, 7);
  const h30 = store.getHits(row.guild_id, 30);
  const uses7 = store.inviteUsesDelta(row.guild_id, 7);
  const uses30 = store.inviteUsesDelta(row.guild_id, 30);
  const latest = store.latestSample(row.guild_id);
  const growth = store.growth(row.guild_id, 7);

  const ranks = row.published
    ? row.tags
        .map((t) => {
          const r = directory.rankOf(row.guild_id, t);
          return r ? `**#${r.rank}** of ${r.of} in ${tagLabel(t)}` : null;
        })
        .filter(Boolean)
    : [];

  const embed = brandEmbed(BRAND.primary)
    .setTitle(`Stats — ${row.name}`)
    .setURL(pageUrl(config, row))
    .addFields(
      { name: "Page views", value: `**${h7.views}** last 7d · ${h30.views} last 30d`, inline: true },
      { name: "Join clicks", value: `**${h7.clicks}** last 7d · ${h30.clicks} last 30d`, inline: true },
      {
        name: "Invite uses",
        value:
          uses7 === null
            ? "_Not measured — give Beacon **Manage Server** to track real invite uses._"
            : `**${uses7}** last 7d · ${uses30 ?? 0} last 30d`,
        inline: false,
      },
      {
        name: "Members",
        value: latest
          ? `${latest.members.toLocaleString("en-US")} · ${latest.online.toLocaleString("en-US")} online · ${growth >= 0 ? "+" : ""}${growth} this week`
          : "_First sample arrives within the hour._",
        inline: false,
      },
      {
        name: "Directory",
        value: row.published ? (ranks.length ? ranks.join("\n") : "_Ranking is computed within the hour._") : "Unlisted — run **`/beacon publish`**",
        inline: false,
      }
    );
  return replyEmbed(interaction, embed);
}

async function handleDigest(interaction) {
  const { store } = ctx(interaction);
  const row = ensureDraft(interaction);
  const channel = interaction.options.getChannel("channel");
  const enabled = interaction.options.getBoolean("enabled");

  if (enabled) {
    const perms = channel.permissionsFor(interaction.guild.members.me);
    if (!perms?.has(PermissionFlagsBits.SendMessages) || !perms?.has(PermissionFlagsBits.EmbedLinks)) {
      return replyError(interaction, `I can't post in ${channel}`, "Give me **Send Messages** and **Embed Links** there, then try again.");
    }
  }
  store.updateGuild(row.guild_id, { digest_channel_id: channel.id, digest_enabled: enabled ? 1 : 0 });
  const { config } = ctx(interaction);
  return replySuccess(
    interaction,
    enabled ? "Weekly digest on" : "Weekly digest off",
    enabled
      ? `Every Monday around ${String(config.digestHourUtc).padStart(2, "0")}:00 UTC I'll post views, join clicks, growth, and rank in ${channel}.`
      : "No more digests. Turn it back on any time."
  );
}

async function handleRemove(interaction) {
  const row = ensureDraft(interaction);
  return interaction.reply(buildRemovePrompt(row));
}
