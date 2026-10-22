import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * SQLite via Node's built-in `node:sqlite` — no native module to compile, so
 * `npm install` works everywhere and the Docker image needs no toolchain.
 * Migrations are numbered and tracked with PRAGMA user_version.
 */

const MIGRATIONS = [
  // 1 — initial schema
  `
  CREATE TABLE guilds (
    guild_id          TEXT PRIMARY KEY,
    slug              TEXT UNIQUE,
    name              TEXT NOT NULL,
    icon_url          TEXT,
    banner_url        TEXT,
    banner_path       TEXT,
    tagline           TEXT,
    description       TEXT,
    tags              TEXT NOT NULL DEFAULT '[]',
    invite_code       TEXT,
    invite_channel_id TEXT,
    nsfw              INTEGER NOT NULL DEFAULT 0,
    published         INTEGER NOT NULL DEFAULT 0,
    featured          INTEGER NOT NULL DEFAULT 0,
    banned            INTEGER NOT NULL DEFAULT 0,
    ban_reason        TEXT,
    digest_channel_id TEXT,
    digest_enabled    INTEGER NOT NULL DEFAULT 0,
    last_digest_at    TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL,
    deleted_at        TEXT
  );
  CREATE INDEX idx_guilds_published ON guilds(published, banned, deleted_at);

  CREATE TABLE samples (
    guild_id        TEXT NOT NULL,
    day             TEXT NOT NULL,
    members         INTEGER NOT NULL DEFAULT 0,
    online          INTEGER NOT NULL DEFAULT 0,
    events_upcoming INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, day)
  );

  CREATE TABLE hits (
    guild_id TEXT NOT NULL,
    day      TEXT NOT NULL,
    views    INTEGER NOT NULL DEFAULT 0,
    clicks   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, day)
  );

  CREATE TABLE invite_uses (
    guild_id TEXT NOT NULL,
    day      TEXT NOT NULL,
    uses     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, day)
  );

  CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
  `,
];

export function openDatabase(path) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

function migrate(db) {
  const { user_version: current } = db.prepare("PRAGMA user_version").get();
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[v]);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw new Error(`Migration ${v + 1} failed: ${err.message}`);
    }
  }
}
