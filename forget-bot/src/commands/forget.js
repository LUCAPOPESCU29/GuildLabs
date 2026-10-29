/**
 * /forget — Forget's helper command.
 *
 * The embeds are meant to be automatic: Forget finds the staff channel itself,
 * writes the copy itself, and posts it. The subcommands exist for the moments a
 * human wants to steer (pin a channel, pick a topic).
 */

import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { Config } from "../lib/config-store.js";
import { findStaffChannel, rankStaffChannels, findPublicChannel } from "../lib/staff-channels.js";
import { writeEmbedCopy, isAiConfigured } from "../lib/ai.js";
import {
  forgetEmbed,
  composeEmbed,
  detectionEmbed,
  successEmbed,
  replyError,
  subtext,
  EPHEMERAL,
  FORGET,
} from "../lib/embeds.js";

/* What Forget can write, with static fallbacks so it works without a key. */
const KINDS = {
  briefing: {
    label: "Staff briefing",
    tone: "accent",
    staffOnly: true,
    fallback: {
      title: "Staff briefing",
      description:
        "Here's the state of play. Keep an eye on the queue, and flag anything that needs a second opinion.",
      fields: [
        { name: "Priority", value: "Reports first, then appeals.", inline: true },
        { name: "Reminder", value: "Log every action.", inline: true },
      ],
      footer: "Forget · staff",
    },
  },
  welcome: {
    label: "Welcome message",
    tone: "info",
    staffOnly: false,
    fallback: {
      title: "Welcome aboard",
      description:
        "Glad you're here. Take a look around, introduce yourself, and shout if you need anything.",
      fields: [{ name: "Start here", value: "Read the rules, then say hi.", inline: false }],
      footer: "Forget",
    },
  },
  rules: {
    label: "Rules card",
    tone: "warning",
    staffOnly: false,
    fallback: {
      title: "House rules",
      description: "Short version: be decent, stay on topic, and don't make work for the mods.",
      fields: [
        { name: "Be kind", value: "No harassment, slurs or pile-ons.", inline: true },
        { name: "Stay on topic", value: "Use the right channel.", inline: true },
      ],
      footer: "Forget",
    },
  },
  announcement: {
    label: "Announcement",
    tone: "success",
    staffOnly: false,
    fallback: {
      title: "Announcement",
      description: "We've got news worth sharing. Details below.",
      fields: [],
      footer: "Forget",
    },
  },
};

/** Resolve where a given kind should be posted: pinned config → detection. */
function resolveTarget(guild, kind) {
  const pinned = Config.getKey(guild.id, "staffChannelId");
  if (KINDS[kind].staffOnly) {
    if (pinned) {
      const ch = guild.channels.cache.get(pinned);
      if (ch) return { channel: ch, how: "pinned by an admin" };
    }
    const best = findStaffChannel(guild);
    return best ? { channel: best.channel, how: best.reasons[0] ?? "detected" } : null;
  }
  const pub = findPublicChannel(guild);
  return pub ? { channel: pub, how: "public channel" } : null;
}

export default {
  data: new SlashCommandBuilder()
    .setName("forget")
    .setDescription("Forget — your server's helper")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("post")
        .setDescription("Write a beautiful embed and post it automatically")
        .addStringOption((o) =>
          o
            .setName("kind")
            .setDescription("What should Forget write?")
            .setRequired(true)
            .addChoices(...Object.entries(KINDS).map(([v, k]) => ({ name: k.label, value: v })))
        )
        .addStringOption((o) =>
          o.setName("about").setDescription("Anything specific to mention").setMaxLength(400)
        )
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Override where it goes")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
    )
    .addSubcommand((s) =>
      s.setName("scan").setDescription("Show which channel Forget thinks is the staff channel")
    )
    .addSubcommand((s) =>
      s
        .setName("channel")
        .setDescription("Pin the staff channel so Forget stops guessing")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("The staff channel")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    if (!guild) return replyError(interaction, "Server only", "Run this inside a server.");

    // ── /forget scan ──────────────────────────────────────────────────────
    if (sub === "scan") {
      await interaction.deferReply(EPHEMERAL);
      const ranked = rankStaffChannels(guild);
      const chosen = findStaffChannel(guild);
      return interaction.editReply(detectionEmbed(interaction.client, ranked, chosen));
    }

    // ── /forget channel ───────────────────────────────────────────────────
    if (sub === "channel") {
      await interaction.deferReply(EPHEMERAL);
      const channel = interaction.options.getChannel("channel");
      Config.set(guild.id, "staffChannelId", channel.id);
      return interaction.editReply({
        embeds: [
          successEmbed(
            interaction.client,
            "Staff channel pinned",
            `Staff embeds will go to ${channel} from now on.`
          ),
        ],
      });
    }

    // ── /forget post ──────────────────────────────────────────────────────
    await interaction.deferReply(EPHEMERAL);
    const kind = interaction.options.getString("kind");
    const about = interaction.options.getString("about") ?? "";
    const override = interaction.options.getChannel("channel");
    const spec = KINDS[kind];

    const target = override ? { channel: override, how: "you chose it" } : resolveTarget(guild, kind);

    if (!target) {
      return replyError(
        interaction,
        "Nowhere to post",
        spec.staffOnly
          ? "I couldn't confidently identify a staff channel. Run **`/forget scan`** to see what I looked at, or pin one with **`/forget channel`**."
          : "I couldn't find a channel I'm allowed to post in. Check my **View Channel** and **Send Messages** permissions."
      );
    }

    const me = guild.members.me;
    if (!target.channel.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages)) {
      return replyError(
        interaction,
        "I can't post there",
        `I don't have **Send Messages** in ${target.channel}.`
      );
    }

    const copy = await writeEmbedCopy(
      kind,
      [
        `Server: ${guild.name}`,
        `Members: ${guild.memberCount}`,
        `Channel: #${target.channel.name}`,
        `Audience: ${spec.staffOnly ? "server staff only" : "all members"}`,
        about ? `Specifically mention: ${about}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      spec.fallback,
      // Real channel + role names, so genuine #refs survive and invented ones don't.
      [...guild.channels.cache.map((c) => c.name), ...guild.roles.cache.map((r) => r.name)]
    );

    const payload = composeEmbed(interaction.client, copy, {
      tone: spec.tone,
      thumbnail: guild.iconURL({ size: 128 }) ?? undefined,
    });

    const sent = await target.channel.send(payload);

    return interaction.editReply({
      embeds: [
        forgetEmbed(interaction.client, "success")
          .setTitle("Posted")
          .setDescription(
            `**${spec.label}** is live in ${target.channel}.\n\n` +
              subtext(copy.source === "ai" ? "Written just now by Groq" : "Groq unavailable — used fallback copy")
          )
          .addFields(
            { name: "Why there", value: target.how, inline: true },
            { name: "Copy", value: copy.source === "ai" ? "written by AI" : "fallback (no AI key)", inline: true },
            { name: "Jump", value: `[Open message](${sent.url})`, inline: true }
          )
          .setFooter({
            text: isAiConfigured() ? `${FORGET.name} · powered by Groq` : `${FORGET.name} · offline mode`,
          }),
      ],
    });
  },
};
