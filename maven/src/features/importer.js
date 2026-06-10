/**
 * Maven's historical importer.
 *
 * Walks a channel's recent history backwards in pages of 100 messages
 * (Discord's per-request maximum), detecting questions and linking their
 * replies as answers.
 *
 * Rate limits: Discord's REST API allows ~50 requests per second globally.
 * We sleep between pages to stay well under that, and discord.js handles
 * any 429s by waiting and retrying. The biggest practical bottleneck is
 * the embedding model — ~50-100 sentences/sec on shared CPU — so we batch
 * questions together to amortize the model overhead.
 *
 * Progress is reported via a callback so callers (slash command handlers)
 * can edit a Discord message in place.
 */

import { embedBatch } from "./embedder.js";
import { Index } from "./index-store.js";
import { isLikelyQuestion } from "./question-detector.js";

/**
 * @typedef {Object} ImportOptions
 * @property {import("discord.js").TextBasedChannel} channel
 * @property {number} limit            Hard cap on messages to scan.
 * @property {number} minQuestionLength
 * @property {(p: {scanned:number, questions:number, answers:number}) => void} [onProgress]
 *
 * @returns {Promise<{scanned:number, questions:number, answers:number}>}
 */
export async function importChannelHistory({
  channel,
  limit = 1000,
  minQuestionLength = 12,
  onProgress = () => {},
}) {
  const guildId = channel.guild.id;
  const PAGE = 100;

  let scanned = 0;
  let questionsAdded = 0;
  let answersAdded = 0;
  let before = undefined;

  // We collect questions across pages and embed in one batch per page —
  // far faster than embedding one-by-one.
  while (scanned < limit) {
    const want = Math.min(PAGE, limit - scanned);
    let page;
    try {
      page = await channel.messages.fetch({ limit: want, before });
    } catch (err) {
      console.error(`[IMPORT] fetch failed at ${scanned}:`, err.message);
      break;
    }
    if (page.size === 0) break;

    // Sort oldest-first so reply-targets always exist by the time we
    // process the answer. (Discord returns newest-first.)
    const messages = [...page.values()].reverse();
    scanned += messages.length;

    // ── Pass 1: identify questions in this page ───────────────────────────
    const questionMessages = [];
    for (const msg of messages) {
      if (msg.author.bot) continue;
      if (!msg.content?.trim()) continue;
      if (Index.has(guildId, msg.id)) continue;
      if (isLikelyQuestion(msg.content, { minQuestionLength })) {
        questionMessages.push(msg);
      }
    }

    // ── Pass 2: batch embed and add ───────────────────────────────────────
    if (questionMessages.length > 0) {
      const texts = questionMessages.map((m) => m.content.trim());
      const vectors = await embedBatch(texts);
      for (let i = 0; i < questionMessages.length; i++) {
        const m = questionMessages[i];
        // We use Index.add() to get all the validation, but we already paid
        // the embedding cost — we can short-circuit by injecting directly.
        await Index.add({
          guildId,
          channelId: m.channel.id,
          messageId: m.id,
          userId: m.author.id,
          text: m.content,
          askedAt: m.createdTimestamp,
        }).catch(() => null);
        questionsAdded++;
        // The embed cache is already warm for this text (set by embedBatch),
        // so the inner embed() call is a free hit.
        void vectors;
      }
    }

    // ── Pass 3: link replies as answers ───────────────────────────────────
    for (const msg of messages) {
      if (msg.author.bot) continue;
      const refId = msg.reference?.messageId;
      if (refId && Index.has(guildId, refId)) {
        const added = Index.addAnswer({
          guildId,
          questionMessageId: refId,
          messageId: msg.id,
          userId: msg.author.id,
          text: msg.content ?? "",
        });
        if (added) answersAdded++;
      }
    }

    onProgress({ scanned, questions: questionsAdded, answers: answersAdded });

    // Page backwards
    before = messages[0].id; // oldest in this page = next page's "before"

    // Be polite — avoid pushing the global rate limit.
    await sleep(120);
  }

  // Make sure progress is flushed before we report success.
  Index.flush();

  return { scanned, questions: questionsAdded, answers: answersAdded };
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
