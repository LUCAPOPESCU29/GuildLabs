/**
 * Per-USER persistence, kept deliberately separate from config-store.js.
 *
 * config-store keys by guildId and its `allGuildIds()` is iterated by the
 * watchlist/alert schedulers — so mixing per-user records in there would make
 * every user id look like a guild. This store mirrors the same tiny JSON-file
 * API but writes to its own `users.json`, holding personal data: DM price
 * alerts and personal portfolios. Keyed by Discord user id.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Same DATA_DIR convention as config-store (Fly volume in prod, ./data locally).
const DATA_DIR = process.env.DATA_DIR || join(__dirname, "../../data");
mkdirSync(DATA_DIR, { recursive: true });
const STORE_PATH = join(DATA_DIR, "users.json");

let store = {};
if (existsSync(STORE_PATH)) {
  try { store = JSON.parse(readFileSync(STORE_PATH, "utf8")); } catch {}
}

function save() {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export const Users = {
  get(userId) {
    return store[userId] ?? {};
  },

  set(userId, key, value) {
    if (!store[userId]) store[userId] = {};
    store[userId][key] = value;
    save();
  },

  merge(userId, partial) {
    store[userId] = { ...(store[userId] ?? {}), ...partial };
    save();
  },

  getKey(userId, key, fallback = null) {
    return store[userId]?.[key] ?? fallback;
  },

  /** All user ids that currently have stored data. */
  allUserIds() {
    return Object.keys(store);
  },
};
