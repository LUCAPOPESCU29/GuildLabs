import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, "../../data");
mkdirSync(DATA_DIR, { recursive: true });
const STORE_PATH = join(DATA_DIR, "guild-configs.json");

let store = {};
if (existsSync(STORE_PATH)) {
  try { store = JSON.parse(readFileSync(STORE_PATH, "utf8")); } catch {}
}

function save() {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

/**
 * Default config shape per guild. Any property not listed here uses this.
 * Centralizing the defaults keeps consumers simple — they just `.get()`.
 */
const DEFAULTS = Object.freeze({
  watchChannelIds: [],     // [] = watch every text channel the bot can see
  excludedChannelIds: [],
  similarityThreshold: 0.78, // 0..1 — higher = stricter (fewer false matches)
  replyMode: "ephemeral",  // "ephemeral" | "public" | "off"
  minQuestionLength: 12,   // chars — filters "hi?" and similar noise
  enabled: true,
});

export const Config = {
  get(guildId) {
    return { ...DEFAULTS, ...(store[guildId] ?? {}) };
  },

  merge(guildId, partial) {
    store[guildId] = { ...(store[guildId] ?? {}), ...partial };
    save();
  },

  set(guildId, key, value) {
    if (!store[guildId]) store[guildId] = {};
    store[guildId][key] = value;
    save();
  },

  raw(guildId) {
    return store[guildId] ?? {};
  },
};
