import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { Config } from "../lib/config-store.js";
import { Index } from "../features/index-store.js";
import { importChannelHistory } from "../features/importer.js";
import {
  brandEmbed,
  successEmbed,
  infoEmbed,
  errorEmbed,
  BRAND,
  EPHEMERAL,
} from "../lib/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("maven")
    .setDescription("Maven — past wisdom, recovered.")

    // ── Everyone ────────────────────────────────────────────────────────
    .addSubcommand((s) =>
      s.setName("search")
        .setDescription("Search past questions in this server")
        .addStringOption((o) =>
          o.setName("query").setDescription("What are you trying to find?")
            .setRequired(true).setMaxLength(280)
        )
    )
    .addSubcommand((s) =>
      s.setName("stats").setDescription("How much wisdom is preserved here")
    )
    .addSubcommand((s) =>
      s.setName("help").setDescription("Show what Maven does and how to use it")
    )

    // ── Admin ──────────────────────────────────────────────────────────
    .addSubcommand((s) =>
      s.setName("show").setDescription("Show Maven's current settings")
    )
    .addSubcommand((s) =>
      s.setName("enable").setDescription("Turn Maven on for this server")
    )
    .addSubcommand((s) =>
      s.setName("disable").setDescription("Turn Maven off for this server")
    )
    .addSubcommand((s) =>
      s.setName("watch")
        .setDescription("Add a channel to Maven's allowlist")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Channel to watch")
            .addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("unwatch")
        .setDescription("Remove a channel from the allowlist")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Channel")
            .addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("sensitivity")
        .setDescription("How close must two questions be to count as a match (50–95%)")
        .addIntegerOption((o) =>
          o.setName("percent").setDescription("Higher = stricter (default 78)")
            .setMinValue(50).setMaxValue(95).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("reply")
        .setDescription("How should Maven reply when it finds a repeat?")
        .addStringOption((o) =>
          o.setName("mode").setDescription("Reply mode").setRequired(true)
            .addChoices(
              { name: "Public — visible to everyone", value: "public" },
              { name: "Quiet — auto-deletes after 60s", value: "ephemeral" },
              { name: "Off — never reply, just index", value: "off" }
            )
        )
    )
    .addSubcommand((s) =>
      s.setName("import")
        .setDescription("Scan a channel's recent history and index past questions (admin)")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Channel to import from")
            .addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addIntegerOption((o) =>
          o.setName("messages").setDescription("How many messages back to scan (max 5000)")
            .setMinValue(100).setMaxValue(5000).setRequired(false)
        )
    )
    .addSubcommand((s) =>
      s.setName("forget")
        .setDescription("Remove a question from the index (paste its message link)")
        .addStringOption((o) =>
          o.setName("link").setDescription("Right-click message → Copy Message Link")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // Permission gating
    const PUBLIC_SUBS = new Set(["search", "stats", "help"]);
    if (!PUBLIC_SUBS.has(sub)
        && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [
          brandEmbed(BRAND.warning)
            .setTitle("Admin only")
            .setDescription("You need **Manage Server** to change Maven's settings."),
        ],
        ...EPHEMERAL,
      });
    }

    switch (sub) {
      case "search":      return handleSearch(interaction, guildId);
      case "stats":       return handleStats(interaction, guildId);
      case "help":        return handleHelp(interaction);
      case "show":        return handleShow(interaction, guildId);
      case "enable":      return handleEnable(interaction, guildId, true);
      case "disable":     return handleEnable(interaction, guildId, false);
      case "watch":       return handleWatch(interaction, guildId, true);
      case "unwatch":     return handleWatch(interaction, guildId, false);
      case "sensitivity": return handleSensitivity(interaction, guildId);
      case "reply":       return handleReplyMode(interaction, guildId);
      case "import":      return handleImport(interaction, guildId);
      case "forget":      return handleForget(interaction, guildId);
    }
  },
};

// ── /maven search ──────────────────────────────────────────────────────────

async function handleSearch(interaction, guildId) {
  await interaction.deferReply(EPHEMERAL);
  const query = interaction.options.getString("query");
  const matches = await Index.search({ guildId, text: query, k: 5, threshold: 0.45 });

  if (matches.length === 0) {
    return interaction.editReply({
      embeds: [
        brandEmbed(BRAND.muted)
          .setTitle("No matches yet")
          .setDescription(
            "Nothing similar in this server's index. Once questions are asked + answered here, " +
            "Maven will remember them. An admin can also run **`/maven import`** to backfill from a channel's history."
          ),
      ],
    });
  }

  const lines = matches.map((m, i) => {
    const link = `https://discord.com/channels/${guildId}/${m.entry.channelId}/${m.entry.messageId}`;
    const pct = Math.round(m.score * 100);
    const ansCount = m.entry.answers.length;
    const ansBadge = ansCount === 0 ? "" : ` · ${ansCount} reply${ansCount === 1 ? "" : "ies"}`;
    return `**${i + 1}.** [${truncate(m.entry.text, 140)}](${link})\n   *${pct}% similar${ansBadge}*`;
  });

  return interaction.editReply({
    embeds: [
      brandEmbed(BRAND.primary)
        .setTitle(`📚 Past wisdom matching "${truncate(query, 60)}"`)
        .setDescription(lines.join("\n\n")),
    ],
  });
}

// ── /maven stats ────────────────────────────────────────────────────────────

async function handleStats(interaction, guildId) {
  const s = Index.stats(guildId);
  const fmt = (ts) => (ts ? `<t:${Math.floor(ts / 1000)}:R>` : "—");
  const answerRate = s.indexedQuestions === 0
    ? "—"
    : `${Math.round((s.answered / s.indexedQuestions) * 100)}%`;

  return interaction.reply({
    embeds: [
      brandEmbed(BRAND.primary)
        .setTitle("📊 Maven stats")
        .addFields(
          { name: "Indexed questions", value: `**${s.indexedQuestions.toLocaleString()}**`, inline: true },
          { name: "Answered", value: `**${s.answered.toLocaleString()}** (${answerRate})`, inline: true },
          { name: "Total replies linked", value: `**${s.totalAnswers.toLocaleString()}**`, inline: true },
          { name: "Helpful votes", value: `${s.totalHelpful} 👍 · ${s.totalNotHelpful} 👎`, inline: true },
          { name: "Oldest", value: fmt(s.oldestAt), inline: true },
          { name: "Newest", value: fmt(s.newestAt), inline: true }
        )
        .setDescription(
          s.indexedQuestions === 0
            ? "Nothing indexed yet — give it a day of normal use, or run `/maven import`."
            : "Each indexed question can surface for future askers."
        ),
    ],
    ...EPHEMERAL,
  });
}

// ── /maven help ────────────────────────────────────────────────────────────

async function handleHelp(interaction) {
  return interaction.reply({
    embeds: [
      brandEmbed(BRAND.primary)
        .setTitle("Maven · how it works")
        .setDescription(
          "I quietly read questions in the channels I'm allowed to watch, " +
          "remember their wording, and link past answers when someone asks " +
          "the same thing again — so wisdom doesn't get buried in scroll."
        )
        .addFields(
          {
            name: "Anyone can",
            value:
              "**`/maven search <query>`** — Search past questions\n" +
              "**`/maven stats`** — See how much wisdom is preserved\n" +
              "**`/maven help`** — This card",
          },
          {
            name: "Admins can",
            value:
              "**`/maven show`** — Current settings\n" +
              "**`/maven enable / disable`** — Pause or resume\n" +
              "**`/maven watch / unwatch <channel>`** — Channel allowlist\n" +
              "**`/maven sensitivity <%>`** — Match strictness (50–95)\n" +
              "**`/maven reply <mode>`** — Public / quiet / off\n" +
              "**`/maven import <channel>`** — Backfill from history\n" +
              "**`/maven forget <message link>`** — Remove a question",
          },
          {
            name: "Privacy",
            value:
              "Maven stores the **text of questions** and the messages that reply to them, " +
              "along with message IDs and a 384-dim embedding. Nothing leaves this bot — " +
              "no external APIs are called for embeddings or storage.",
          }
        ),
    ],
    ...EPHEMERAL,
  });
}

// ── Admin handlers ─────────────────────────────────────────────────────────

async function handleShow(interaction, guildId) {
  const cfg = Config.get(guildId);
  const watched =
    cfg.watchChannelIds.length === 0
      ? "All text channels"
      : cfg.watchChannelIds.map((id) => `<#${id}>`).join(", ");
  const excluded =
    cfg.excludedChannelIds.length === 0
      ? "*(none)*"
      : cfg.excludedChannelIds.map((id) => `<#${id}>`).join(", ");

  return interaction.reply({
    embeds: [
      infoEmbed("Maven settings", `Current configuration for **${interaction.guild.name}**`)
        .addFields(
          { name: "Status", value: cfg.enabled ? "✅ Enabled" : "⏸️ Paused", inline: true },
          { name: "Reply mode", value: cfg.replyMode, inline: true },
          { name: "Sensitivity", value: `${Math.round(cfg.similarityThreshold * 100)}%`, inline: true },
          { name: "Watched channels", value: watched, inline: false },
          { name: "Excluded channels", value: excluded, inline: false },
          { name: "Min question length", value: `${cfg.minQuestionLength} chars`, inline: true }
        ),
    ],
    ...EPHEMERAL,
  });
}

async function handleEnable(interaction, guildId, enabled) {
  Config.merge(guildId, { enabled });
  return interaction.reply({
    embeds: [
      successEmbed(
        enabled ? "Maven enabled" : "Maven paused",
        enabled
          ? "I'll watch for questions and surface past answers."
          : "I'll stop watching and replying. Your index is preserved."
      ),
    ],
    ...EPHEMERAL,
  });
}

async function handleWatch(interaction, guildId, add) {
  const channel = interaction.options.getChannel("channel");
  const cfg = Config.get(guildId);
  let watchChannelIds = [...cfg.watchChannelIds];

  if (add) {
    if (!watchChannelIds.includes(channel.id)) watchChannelIds.push(channel.id);
  } else {
    watchChannelIds = watchChannelIds.filter((id) => id !== channel.id);
  }
  Config.merge(guildId, { watchChannelIds });

  return interaction.reply({
    embeds: [
      successEmbed(
        add ? "Watching channel" : "Stopped watching",
        add
          ? `${channel} is now in Maven's allowlist.`
          : `${channel} removed from the allowlist.`
      ).addFields({
        name: "Total watched",
        value: watchChannelIds.length === 0
          ? "all channels (default)"
          : `${watchChannelIds.length} channel${watchChannelIds.length === 1 ? "" : "s"}`,
      }),
    ],
    ...EPHEMERAL,
  });
}

async function handleSensitivity(interaction, guildId) {
  const pct = interaction.options.getInteger("percent");
  Config.merge(guildId, { similarityThreshold: pct / 100 });
  return interaction.reply({
    embeds: [
      successEmbed(
        `Sensitivity set to ${pct}%`,
        pct >= 85
          ? "Strict — only near-duplicate questions will trigger a reply."
          : pct >= 70
          ? "Balanced — catches the same question phrased differently."
          : "Loose — broader matches, more false positives."
      ),
    ],
    ...EPHEMERAL,
  });
}

async function handleReplyMode(interaction, guildId) {
  const mode = interaction.options.getString("mode");
  Config.merge(guildId, { replyMode: mode });
  const labels = {
    public: "Public replies — everyone sees the link to past answers.",
    ephemeral: "Quiet replies — visible to everyone but auto-deleted after 60s.",
    off: "Replies off — Maven still indexes silently. Use `/maven search` manually.",
  };
  return interaction.reply({
    embeds: [successEmbed("Reply mode updated", labels[mode])],
    ...EPHEMERAL,
  });
}

// ── /maven import ──────────────────────────────────────────────────────────

async function handleImport(interaction, guildId) {
  await interaction.deferReply(EPHEMERAL);
  const channel = interaction.options.getChannel("channel");
  const limit = interaction.options.getInteger("messages") ?? 1000;

  // Permission preflight — we'd waste several seconds before discord
  // surfaces a 50001 if we don't check upfront.
  const me = interaction.guild.members.me;
  const perms = channel.permissionsFor(me);
  if (!perms?.has(PermissionFlagsBits.ViewChannel) || !perms?.has(PermissionFlagsBits.ReadMessageHistory)) {
    return interaction.editReply({
      embeds: [
        errorEmbed(
          "I can't read that channel",
          `Give me **View Channel** and **Read Message History** in ${channel}, then run \`/maven import\` again.`
        ),
      ],
    });
  }

  await interaction.editReply({
    embeds: [
      brandEmbed(BRAND.primary)
        .setTitle("⏳ Importing…")
        .setDescription(`Scanning the last **${limit.toLocaleString()}** messages in ${channel}.\nThis can take a minute or two — I'll update this message as I go.`),
    ],
  });

  // Throttle progress updates — Discord rate-limits message edits.
  let lastUpdate = 0;

  try {
    const result = await importChannelHistory({
      channel,
      limit,
      minQuestionLength: Config.get(guildId).minQuestionLength,
      onProgress: async ({ scanned, questions, answers }) => {
        const now = Date.now();
        if (now - lastUpdate < 2500) return;
        lastUpdate = now;
        await interaction.editReply({
          embeds: [
            brandEmbed(BRAND.primary)
              .setTitle("⏳ Importing…")
              .setDescription(
                `Scanning ${channel}…\n\n` +
                `**${scanned.toLocaleString()}** messages scanned\n` +
                `**${questions.toLocaleString()}** questions found\n` +
                `**${answers.toLocaleString()}** replies linked as answers`
              ),
          ],
        }).catch(() => {});
      },
    });

    return interaction.editReply({
      embeds: [
        successEmbed("Import complete", `Maven is now up to date on ${channel}.`)
          .addFields(
            { name: "Scanned", value: `${result.scanned.toLocaleString()}`, inline: true },
            { name: "Questions added", value: `${result.questions.toLocaleString()}`, inline: true },
            { name: "Answers linked", value: `${result.answers.toLocaleString()}`, inline: true }
          ),
      ],
    });
  } catch (err) {
    console.error("[CMD] /maven import failed:", err);
    return interaction.editReply({
      embeds: [errorEmbed("Import failed", `\`\`\`${err?.message || "Unknown error"}\`\`\``)],
    });
  }
}

// ── /maven forget ──────────────────────────────────────────────────────────

const LINK_RE = /channels\/(\d+)\/(\d+)\/(\d+)/;

async function handleForget(interaction, guildId) {
  const link = interaction.options.getString("link").trim();
  const m = LINK_RE.exec(link);
  if (!m) {
    return interaction.reply({
      embeds: [errorEmbed(
        "That doesn't look like a Discord message link",
        "Right-click the question's message → **Copy Message Link** and paste the result here."
      )],
      ...EPHEMERAL,
    });
  }
  const [, linkGuildId, , messageId] = m;
  if (linkGuildId !== guildId) {
    return interaction.reply({
      embeds: [errorEmbed("Wrong server", "That link points to a different server.")],
      ...EPHEMERAL,
    });
  }

  const entry = Index.get(guildId, messageId);
  if (!entry) {
    return interaction.reply({
      embeds: [brandEmbed(BRAND.muted)
        .setTitle("Not in the index")
        .setDescription("That message isn't currently tracked by Maven.")],
      ...EPHEMERAL,
    });
  }

  Index.remove({ guildId, messageId });
  return interaction.reply({
    embeds: [
      successEmbed(
        "Forgotten",
        `Removed from the index — and **${entry.answers.length}** linked answer(s) along with it.`
      ),
    ],
    ...EPHEMERAL,
  });
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
