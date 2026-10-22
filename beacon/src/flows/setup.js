import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { TAGS, MAX_TAGS, tagLabel, suggestTags, validateTags } from "../lib/tags.js";
import { slugFromName } from "../lib/slug.js";
import { guildVisuals, canCreateInvite, createPermanentInvite, inviteExists } from "../lib/discord-data.js";
import { sessions } from "../lib/sessions.js";
import { brandEmbed, BRAND, replyError } from "../lib/embeds.js";
import { pageUrl } from "../lib/urls.js";

/**
 * `/beacon setup` is a three-step conversation:
 *   1. modal   — tagline + description
 *   2. menus   — pick 1–5 tags (two select menus because Discord caps a menu at
 *                25 options and the taxonomy has 30) + Continue
 *   3. select  — the channel the public invite should open to
 * Each step persists to the store, so an abandoned setup can be resumed.
 */
export const IDS = {
  modal: "beacon:setup:modal",
  tagsA: "beacon:setup:tags:a",
  tagsB: "beacon:setup:tags:b",
  tagsContinue: "beacon:setup:tags:continue",
  channel: "beacon:setup:channel",
};

const HALF = Math.ceil(TAGS.length / 2);
const TAGS_A = TAGS.slice(0, HALF);
const TAGS_B = TAGS.slice(HALF);

// ── Step 1: modal ────────────────────────────────────────────────────────────
export function buildSetupModal(row) {
  const tagline = new TextInputBuilder()
    .setCustomId("tagline")
    .setLabel("Tagline — one line, what is this server?")
    .setStyle(TextInputStyle.Short)
    .setMinLength(3)
    .setMaxLength(80)
    .setRequired(true)
    .setPlaceholder("A friendly place for indie game devs to share progress");
  if (row?.tagline) tagline.setValue(row.tagline.slice(0, 80));

  const description = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Description (optional)")
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(500)
    .setRequired(false)
    .setPlaceholder("Who it's for, what happens here, and what to do first after joining.");
  if (row?.description) description.setValue(row.description.slice(0, 500));

  return new ModalBuilder()
    .setCustomId(IDS.modal)
    .setTitle("Set up your Beacon page")
    .addComponents(
      new ActionRowBuilder().addComponents(tagline),
      new ActionRowBuilder().addComponents(description)
    );
}

export async function handleSetupModal(interaction) {
  const { store } = interaction.client.beacon;
  const guild = interaction.guild;

  const tagline = interaction.fields.getTextInputValue("tagline").trim().replace(/\s+/g, " ");
  const description = interaction.fields.getTextInputValue("description").trim();
  if (tagline.length < 3) {
    return replyError(interaction, "Tagline is too short", "Give it at least a few words.");
  }

  const { row } = store.upsertDraft({ guildId: guild.id, ...guildVisuals(guild) });
  const slug = row.slug ?? slugFromName(guild.name, guild.id, (s) => store.isSlugTaken(s, guild.id));
  store.updateGuild(guild.id, { tagline, description, slug });

  // Suggest tags from data we already have — no AI, no external calls.
  const channels = guild.channels.cache.map((c) => c.name);
  const suggested = row.tags.length
    ? row.tags
    : suggestTags({ name: guild.name, description: `${guild.description ?? ""} ${description}`, channels });

  sessions.set(guild.id, interaction.user.id, {
    tags: {
      a: suggested.filter((t) => TAGS_A.includes(t)),
      b: suggested.filter((t) => TAGS_B.includes(t)),
    },
  });

  return interaction.reply({
    content:
      "**Step 2 of 3 — Tags**\n" +
      `Pick 1–${MAX_TAGS} tags that describe your server. ` +
      (suggested.length ? "Suggestions are pre-selected — adjust them, then press **Continue**." : "Then press **Continue**."),
    components: [
      new ActionRowBuilder().addComponents(tagMenu(IDS.tagsA, TAGS_A, suggested, "Gaming, finance & tech")),
      new ActionRowBuilder().addComponents(tagMenu(IDS.tagsB, TAGS_B, suggested, "Culture, learning & community")),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(IDS.tagsContinue).setLabel("Continue").setStyle(ButtonStyle.Primary)
      ),
    ],
    flags: 64,
  });
}

function tagMenu(customId, tags, selected, placeholder) {
  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(0)
    .setMaxValues(Math.min(MAX_TAGS, tags.length))
    .addOptions(
      tags.map((t) =>
        new StringSelectMenuOptionBuilder().setLabel(tagLabel(t)).setValue(t).setDefault(selected.includes(t))
      )
    );
}

// ── Step 2: tag menus + Continue ─────────────────────────────────────────────
export async function handleTagMenu(interaction) {
  const which = interaction.customId === IDS.tagsA ? "a" : "b";
  const current = sessions.get(interaction.guild.id, interaction.user.id) ?? { tags: { a: [], b: [] } };
  sessions.set(interaction.guild.id, interaction.user.id, {
    ...current,
    tags: { ...current.tags, [which]: interaction.values },
  });
  return interaction.deferUpdate();
}

export async function handleTagsContinue(interaction) {
  const { store } = interaction.client.beacon;
  const session = sessions.get(interaction.guild.id, interaction.user.id);
  if (!session) {
    return interaction.update({
      content: "That setup session expired. Run **`/beacon setup`** again.",
      components: [],
    });
  }
  const result = validateTags([...(session.tags.a ?? []), ...(session.tags.b ?? [])]);
  if (!result.ok) {
    // Keep the menus so they can fix it; just swap the headline.
    return interaction.update({
      content: `**Step 2 of 3 — Tags**\n⚠️ ${result.error}`,
      components: interaction.message.components,
    });
  }
  store.updateGuild(interaction.guild.id, { tags: result.tags });

  return interaction.update({
    content:
      "**Step 3 of 3 — Invite channel**\n" +
      "Which channel should your public invite link open to? Beacon creates a permanent invite there and keeps it alive.",
    components: [
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(IDS.channel)
          .setPlaceholder("Choose a channel")
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setMinValues(1)
          .setMaxValues(1)
      ),
    ],
  });
}

// ── Step 3: invite channel ───────────────────────────────────────────────────
export async function handleChannelSelect(interaction) {
  const { store, config, directory } = interaction.client.beacon;
  const guild = interaction.guild;
  const channel = guild.channels.cache.get(interaction.values[0]) ?? interaction.channels.first();
  const me = guild.members.me;

  if (!channel || !canCreateInvite(channel, me)) {
    return interaction.update({
      content:
        "**Step 3 of 3 — Invite channel**\n" +
        `⚠️ I can't create invites in ${channel ?? "that channel"}. Give me **Create Invite** there, or pick another channel.`,
      components: interaction.message.components,
    });
  }

  await interaction.deferUpdate();

  let row = store.getGuild(guild.id);
  let code = row.invite_code;
  const reuse = code && row.invite_channel_id === channel.id && (await inviteExists(interaction.client, code)) === true;
  if (!reuse) {
    try {
      code = await createPermanentInvite(channel);
    } catch (err) {
      return interaction.editReply({
        content: `**Step 3 of 3 — Invite channel**\n⚠️ Discord refused to create an invite: \`${err.message}\`. Try another channel.`,
        components: interaction.message.components,
      });
    }
  }
  row = store.updateGuild(guild.id, { invite_code: code, invite_channel_id: channel.id });
  sessions.clear(guild.id, interaction.user.id);
  directory.invalidate();

  const url = pageUrl(config, row);
  const embed = brandEmbed(BRAND.success)
    .setTitle("✅ Your page is ready")
    .setDescription(
      `**${row.name}** now has a live page:\n${url}\n\n` +
        (row.published
          ? "It's listed in the directory."
          : "It's **unlisted** for now — anyone with the link can see it. Run **`/beacon publish`** to list it in the directory.")
    )
    .addFields(
      { name: "Tagline", value: row.tagline, inline: false },
      { name: "Tags", value: row.tags.map(tagLabel).join(" · "), inline: true },
      { name: "Invite opens to", value: `${channel}`, inline: true },
      {
        name: "Next",
        value:
          "• **`/beacon publish`** — list it in the directory\n" +
          "• **`/beacon banner`** — add a banner image\n" +
          "• **`/beacon slug`** — customise the link\n" +
          "• **`/beacon digest`** — weekly stats in a channel",
        inline: false,
      }
    );
  if (row.nsfw) {
    embed.addFields({
      name: "Heads up",
      value: "This server is age-restricted in Discord's settings, so it can't be listed in the directory. The page still works by link.",
    });
  }
  return interaction.editReply({ content: "", embeds: [embed], components: [] });
}
