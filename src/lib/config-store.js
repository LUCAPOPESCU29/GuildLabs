import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, "../../data/guild-configs.json");

// Ensure data dir exists
import { mkdirSync } from "fs";
mkdirSync(join(__dirname, "../../data"), { recursive: true });

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
};
