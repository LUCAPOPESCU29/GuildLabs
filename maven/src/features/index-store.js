/**
 * Maven's vector index — per-guild in-memory cosine search with periodic
 * atomic disk snapshots.
 *
 * Why in-memory:    Most servers will index <10k questions. At 384 floats × 4
 *                   bytes each, that's ~15MB of vectors — fits comfortably in
 *                   the machine's RAM and a brute-force scan is ~5ms for 10k.
 *
 * Why JSON files:   One file per guild keeps things debuggable (you can `cat`
 *                   it) and sidesteps build issues with SQLite extensions on
 *                   minimal Linux images. The schema is forward-migratable.
 *
 * Why atomic write: We write to a `.tmp` file then `rename()` over the
 *                   real one — rename is atomic on POSIX, so a crash mid-write
 *                   can never produce a corrupt index file.
 *
 * Snapshot cadence: Dirty guilds are flushed every 30 seconds AND on
 *                   SIGTERM/SIGINT/beforeExit. Worst-case data loss is 30s,
 *                   and since the source-of-truth questions still live in
 *                   Discord, we always re-index naturally on the next message.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { embed, cosine } from "./embedder.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, "../../data");
const INDEX_DIR = join(DATA_DIR, "index");
mkdirSync(INDEX_DIR, { recursive: true });

// guildId → Slot ({ entries: Entry[], byMessageId: Map })
const memory = new Map();
const dirty = new Set();

/**
 * @typedef {Object} Answer
 * @property {string} messageId
 * @property {string} userId
 * @property {string} text     - capped to 500 chars
 * @property {number} addedAt  - ms epoch
 *
 * @typedef {Object} Entry
 * @property {string} id              - same as messageId, unique within a guild
 * @property {string} channelId
 * @property {string} messageId
 * @property {string} userId
 * @property {string} text            - capped to 500 chars
 * @property {number[]} vector        - 384-dim embedding (normalized)
 * @property {number} askedAt         - ms epoch
 * @property {Answer[]} answers
 * @property {number} helpful         - feedback count
 * @property {number} notHelpful      - feedback count
 */

function indexPath(guildId) {
  return join(INDEX_DIR, `${guildId}.json`);
}

/** Ensure an on-disk entry has every field of the current schema. */
function migrate(entry) {
  if (!Array.isArray(entry.answers)) entry.answers = [];
  if (typeof entry.helpful !== "number") entry.helpful = 0;
  if (typeof entry.notHelpful !== "number") entry.notHelpful = 0;
  return entry;
}

function loadGuild(guildId) {
  if (memory.has(guildId)) return memory.get(guildId);
  const path = indexPath(guildId);
  let entries = [];
  if (existsSync(path)) {
    try {
      const data = JSON.parse(readFileSync(path, "utf8"));
      entries = Array.isArray(data.entries) ? data.entries.map(migrate) : [];
    } catch (err) {
      console.error(`[INDEX] corrupt index for ${guildId}, starting clean:`, err.message);
      entries = [];
    }
  }
  // Build a messageId → entry index for O(1) lookups
  const byMessageId = new Map();
  for (const e of entries) byMessageId.set(e.messageId, e);
  const slot = { entries, byMessageId };
  memory.set(guildId, slot);
  return slot;
}

/** Atomic write — never leaves the index file in a partially-written state. */
function atomicWriteJson(path, value) {
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(value));
  renameSync(tmp, path);
}

function persist() {
  for (const guildId of dirty) {
    const slot = memory.get(guildId);
    if (!slot) continue;
    try {
      atomicWriteJson(indexPath(guildId), { entries: slot.entries });
    } catch (err) {
      console.error(`[INDEX] failed to persist ${guildId}:`, err.message);
    }
  }
  dirty.clear();
}

/** Cap an entry's text at 500 chars so the JSON file doesn't bloat. */
function capText(s) {
  if (!s) return "";
  return s.length > 500 ? s.slice(0, 499) + "…" : s;
}

// ── Snapshot + graceful shutdown ────────────────────────────────────────────
const snapshotTimer = setInterval(() => persist(), 30_000);
// unref so the timer doesn't keep the process alive on its own
snapshotTimer.unref?.();

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[INDEX] ${signal} — flushing ${dirty.size} dirty guild(s)`);
  persist();
  clearInterval(snapshotTimer);
}
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("beforeExit", () => shutdown("beforeExit"));

// ── Public API ─────────────────────────────────────────────────────────────
export const Index = {
  /** Load every per-guild JSON file on disk into memory. */
  hydrate() {
    if (!existsSync(INDEX_DIR)) return;
    let n = 0;
    for (const file of readdirSync(INDEX_DIR)) {
      if (file.endsWith(".json")) {
        loadGuild(file.replace(".json", ""));
        n++;
      }
    }
    console.log(`[INDEX] hydrated ${n} guild(s)`);
  },

  /** Whether a given message is already indexed as a question. */
  has(guildId, messageId) {
    return loadGuild(guildId).byMessageId.has(messageId);
  },

  /** Fetch a single entry by messageId, or null. */
  get(guildId, messageId) {
    return loadGuild(guildId).byMessageId.get(messageId) ?? null;
  },

  /**
   * Add a new question. Idempotent on messageId.
   * Returns the created entry, or null if it already existed.
   */
  async add({ guildId, channelId, messageId, userId, text, askedAt }) {
    const slot = loadGuild(guildId);
    if (slot.byMessageId.has(messageId)) return null;

    const vector = await embed(text);
    const entry = {
      id: messageId,
      channelId,
      messageId,
      userId,
      text: capText(text),
      vector,
      askedAt: askedAt ?? Date.now(),
      answers: [],
      helpful: 0,
      notHelpful: 0,
    };
    slot.entries.push(entry);
    slot.byMessageId.set(messageId, entry);
    dirty.add(guildId);
    return entry;
  },

  /**
   * Attach an answer message to an existing question entry.
   * Idempotent on (questionMessageId, answerMessageId).
   */
  addAnswer({ guildId, questionMessageId, messageId, userId, text }) {
    const entry = loadGuild(guildId).byMessageId.get(questionMessageId);
    if (!entry) return false;
    if (entry.answers.some((a) => a.messageId === messageId)) return false;
    entry.answers.push({
      messageId,
      userId,
      text: capText(text),
      addedAt: Date.now(),
    });
    dirty.add(guildId);
    return true;
  },

  /** Record a feedback vote on an entry. */
  vote({ guildId, messageId, helpful }) {
    const entry = loadGuild(guildId).byMessageId.get(messageId);
    if (!entry) return false;
    if (helpful) entry.helpful += 1;
    else entry.notHelpful += 1;
    dirty.add(guildId);
    return true;
  },

  /**
   * Cosine top-K search.
   * Ranking: similarity first, tiebroken by helpfulness so well-voted entries
   * float to the top when scores are close.
   */
  async search({ guildId, text, k = 3, threshold = 0 }) {
    const slot = loadGuild(guildId);
    if (slot.entries.length === 0) return [];
    const query = await embed(text);
    const scored = [];
    for (const entry of slot.entries) {
      const score = cosine(query, entry.vector);
      if (score >= threshold) scored.push({ entry, score });
    }
    scored.sort((a, b) => {
      // Primary: similarity
      const diff = b.score - a.score;
      // If two are within 3% of each other, prefer the one with positive feedback
      if (Math.abs(diff) > 0.03) return diff;
      const ah = a.entry.helpful - a.entry.notHelpful;
      const bh = b.entry.helpful - b.entry.notHelpful;
      return bh - ah;
    });
    return scored.slice(0, k);
  },

  /** Drop a single entry (deletion / forget / spam cleanup). */
  remove({ guildId, messageId }) {
    const slot = loadGuild(guildId);
    if (!slot.byMessageId.has(messageId)) return false;
    slot.entries = slot.entries.filter((e) => e.messageId !== messageId);
    slot.byMessageId.delete(messageId);
    dirty.add(guildId);
    return true;
  },

  /** Drop an answer reference (when an answer message is deleted). */
  removeAnswer({ guildId, messageId }) {
    const slot = loadGuild(guildId);
    let removed = 0;
    for (const entry of slot.entries) {
      const before = entry.answers.length;
      entry.answers = entry.answers.filter((a) => a.messageId !== messageId);
      removed += before - entry.answers.length;
    }
    if (removed > 0) dirty.add(guildId);
    return removed;
  },

  /** Summary stats for /maven stats. */
  stats(guildId) {
    const slot = loadGuild(guildId);
    const entries = slot.entries;
    const answered = entries.filter((e) => e.answers.length > 0).length;
    const totalAnswers = entries.reduce((s, e) => s + e.answers.length, 0);
    const totalHelpful = entries.reduce((s, e) => s + e.helpful, 0);
    const totalNotHelpful = entries.reduce((s, e) => s + e.notHelpful, 0);
    return {
      indexedQuestions: entries.length,
      answered,
      unanswered: entries.length - answered,
      totalAnswers,
      totalHelpful,
      totalNotHelpful,
      oldestAt: entries[0]?.askedAt ?? null,
      newestAt: entries[entries.length - 1]?.askedAt ?? null,
    };
  },

  /** Force an immediate persist. Used by shutdown + tests. */
  flush() { persist(); },

  /** Test utility — returns the size of the in-memory map. */
  size(guildId) { return loadGuild(guildId).entries.length; },
};

Index.hydrate();
