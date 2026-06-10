import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// DATA_DIR lets Fly.io point us at a mounted volume; falls back to local ./data
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

export const Config = {
  get(guildId) {
    return store[guildId] ?? {};
  },

  set(guildId, key, value) {
    if (!store[guildId]) store[guildId] = {};
    store[guildId][key] = value;
    save();
  },

  merge(guildId, partial) {
    store[guildId] = { ...(store[guildId] ?? {}), ...partial };
    save();
  },

  getKey(guildId, key, fallback = null) {
    return store[guildId]?.[key] ?? fallback;
  },

  /** All guild ids that currently have stored config. */
  allGuildIds() {
    return Object.keys(store);
  },
};
