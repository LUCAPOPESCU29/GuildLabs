import { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Config } from "../lib/config-store.js";
import { Index } from "../features/index-store.js";
import { isLikelyQuestion } from "../features/question-detector.js";
import { brandEmbed, BRAND } from "../lib/embeds.js";

/**
 * The bot's heart. For every guild message:
 *
 *   1. If the channel is muted in config → bail.
 *   2. If the message is a REPLY or lives in a THREAD whose parent is an
 *      indexed question → store it as an answer. (Future searches can show
 *      the answer body, not just the question.)
 *   3. If the message itself looks like a question:
 *      a) Search the existing index for similar past questions.
 *      b) If a high-confidence match exists, surface it (with feedback
 *         buttons) so future askers benefit too.
 *      c) Index the new question so it joins the pool.
 *
 * Notes on ordering: we always SEARCH before we INDEX the current message,
 * so the message can't "find itself" as its own best match.
 */

export default {
  name: "messageCreate",
  async execute(message, client) {
    // ── Hard skips ──────────────────────────────────────────────────────────
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content?.trim()) return;

    const cfg = Config.get(message.guild.id);
    if (!cfg.enabled) return;

    // Resolve the "logical" channel — for thread messages, watch the parent.
    const isThread =
      message.channel.type === ChannelType.PublicThread ||
      message.channel.type === ChannelType.PrivateThread ||
      message.channel.type === ChannelType.AnnouncementThread;
    const watchableId = isThread ? message.channel.parentId : message.channel.id;

    if (cfg.watchChannelIds.length > 0 && !cfg.watchChannelIds.includes(watchableId)) return;
    if (cfg.excludedChannelIds.includes(watchableId)) return;

    // ── Step 1: is this an ANSWER to a question we already know? ───────────
    // Two ways a message answers a question:
    //   a) It replies (reference.messageId) to an indexed question.
    //   b) It posts inside a thread whose starter message is an indexed question.
    try {
      const referencedId = message.reference?.messageId;
      if (referencedId && Index.has(message.guild.id, referencedId)) {
        Index.addAnswer({
          guildId: message.guild.id,
          questionMessageId: referencedId,
          messageId: message.id,
          userId: message.author.id,
          text: message.content,
        });
      } else if (isThread) {
        // Thread starter message is the question; thread id usually equals
        // the starter message id when the thread was created from a message.
        const starterId = message.channel.id;
        if (Index.has(message.guild.id, starterId)) {
          Index.addAnswer({
            guildId: message.guild.id,
            questionMessageId: starterId,
            messageId: message.id,
            userId: message.author.id,
            text: message.content,
          });
        }
      }
    } catch (err) {
      console.error(`[MSG] answer-link failed for ${message.id}:`, err.message);
    }

    // ── Step 2: is this a question worth indexing? ─────────────────────────
    const text = message.content.trim();
    if (!isLikelyQuestion(text, { minLength: cfg.minQuestionLength })) return;

    try {
      // 2a. Search BEFORE we add the new message — self-match avoidance.
      const matches = await Index.search({
        guildId: message.guild.id,
        text,
        k: 3,
        threshold: cfg.similarityThreshold,
      });

      if (matches.length > 0 && cfg.replyMode !== "off") {
        await surfaceMatches(message, matches, cfg.replyMode);
      }

      // 2b. Add the new question to the index for future askers.
      await Index.add({
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: message.id,
        userId: message.author.id,
        text,
        askedAt: message.createdTimestamp,
      });
    } catch (err) {
      console.error(`[MSG] indexing failed for ${message.id}:`, err.message);
    }
  },
};

// ── Surface helper ────────────────────────────────────────────────────────

async function surfaceMatches(message, matches, mode) {
  const best = matches[0];
  const guildId = message.guild.id;
  const link = `https://discord.com/channels/${guildId}/${best.entry.channelId}/${best.entry.messageId}`;
  const confidence = Math.round(best.score * 100);

  const embed = brandEmbed(BRAND.primary)
    .setAuthor({ name: "Maven · past wisdom" })
    .setDescription(
      `This sounds similar to a question already in this server:\n\n` +
        `> ${truncate(best.entry.text, 220)}\n\n` +
        formatBestAnswer(best.entry) +
        `\n[**Jump to that conversation →**](${link})`
    )
    .setFooter({ text: `${confidence}% similar · Maven by GuildLabs` });

  // If we have more than one strong match, list them as additional links.
  if (matches.length > 1) {
    const others = matches.slice(1, 3).map((m, i) => {
      const l = `https://discord.com/channels/${guildId}/${m.entry.channelId}/${m.entry.messageId}`;
      const pct = Math.round(m.score * 100);
      return `**#${i + 2}** [${truncate(m.entry.text, 120)}](${l}) · *${pct}% similar*`;
    });
    embed.addFields({ name: "Also similar", value: others.join("\n") });
  }

  // Feedback buttons — encoded with the matched entry's id so we know
  // which entry the vote applies to.
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`mvn_fb_yes_${best.entry.id}`)
      .setLabel("This helped")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`mvn_fb_no_${best.entry.id}`)
      .setLabel("Wrong match")
      .setEmoji("✖")
      .setStyle(ButtonStyle.Secondary),
  );

  const reply = await message
    .reply({
      embeds: [embed],
      components: [row],
      allowedMentions: { repliedUser: mode === "public" },
    })
    .catch(() => null);

  // Quiet mode auto-deletes after a minute to keep the channel tidy.
  if (reply && mode === "ephemeral") {
    setTimeout(() => reply.delete().catch(() => {}), 60_000);
  }
}

function formatBestAnswer(entry) {
  if (!entry.answers || entry.answers.length === 0) return "";
  // Prefer the longest answer — usually the most substantive.
  const ans = [...entry.answers].sort((a, b) => b.text.length - a.text.length)[0];
  return `**Answer in that thread:**\n> ${truncate(ans.text, 220)}\n\n`;
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
