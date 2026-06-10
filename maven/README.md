# Maven

**Surfaces past wisdom when a question has been asked before.**
A Discord bot by [GuildLabs](https://guildlabs.vercel.app/bots/maven).

---

## What it does

Maven quietly indexes every question asked in the channels you allow,
*understands* their meaning with a local embedding model, and links the
past answer when someone asks the same thing again — so wisdom doesn't
get buried in scroll.

It also captures the **replies and thread messages** that answer those
questions, so when it surfaces a past match it shows the actual answer,
not just the question.

## Quickstart

```bash
cd maven
cp .env.example .env       # paste DISCORD_TOKEN and CLIENT_ID
npm install                 # ~30s
npm start                   # ~5s startup + ~1s model warmup
```

On first run Maven will:

1. Connect to Discord and register slash commands per-guild (instant).
2. Background-load the embedding model (`Xenova/all-MiniLM-L6-v2`, ~22MB).
3. Start its dashboard API on `BOT_API_PORT` (default 3009).
4. Hydrate any previously-indexed questions from `data/index/*.json`.

Required in the Discord Dev Portal:

- **Bot → Privileged Gateway Intents → Message Content Intent: ON**
  (Maven reads message text to detect questions.)

## Smoke test (no Discord token required)

```bash
node src/test-smoke.js
```

Verifies: embedder dimensions + determinism, semantic similarity,
question detection, index add/search/answer/vote, persistence round-trip.

## Slash commands

### Everyone

| Command | What it does |
|---|---|
| `/maven search <query>` | Manually search past questions |
| `/maven stats` | How much wisdom is preserved + answer rate |
| `/maven help` | Explainer card with all commands |

### Admins (require **Manage Server**)

| Command | What it does |
|---|---|
| `/maven show` | Current settings for this server |
| `/maven enable` / `disable` | Pause/resume passive surfacing |
| `/maven watch <channel>` | Add a channel to the allowlist |
| `/maven unwatch <channel>` | Remove a channel from the allowlist |
| `/maven sensitivity <50-95>` | How close two questions must be to match |
| `/maven reply <mode>` | Public / quiet (auto-delete) / off |
| `/maven import <channel> [N]` | Backfill from N recent messages (max 5000) |
| `/maven forget <message link>` | Drop a specific question from the index |

## How automatic surfacing works

Every message in a watched channel goes through:

1. **Answer link** — if it's a reply (or a thread message) to an
   already-indexed question, attach it as an answer to that entry.
2. **Question detect** — does it look like a question? (Heuristics in
   `src/features/question-detector.js`.)
3. **Search** — find the top-3 most similar past questions above the
   server's sensitivity threshold.
4. **Surface** — if there's a strong match, reply with the previous
   conversation's link + the best answer snippet + feedback buttons
   ("This helped" / "Wrong match").
5. **Index** — add the new question to the pool so future askers benefit.

Feedback votes tiebreak future search ranking when two matches have
near-identical similarity scores.

## Architecture

```
src/
├── index.js                 entry point: client + listeners + api server
├── lib/
│   ├── loader.js            auto-loads commands + events
│   ├── register-commands.js per-guild instant registration (no global wait)
│   ├── embeds.js            Maven's warm-gold visual identity
│   ├── config-store.js      per-guild settings, JSON, DATA_DIR aware
│   └── api-server.js        Express API for dashboard integration
├── commands/
│   └── maven.js             one command, twelve subcommands
├── events/
│   ├── ready.js             registers commands on boot
│   ├── guildCreate.js       greets new servers, registers commands
│   ├── messageCreate.js     the heart: detect → search → surface → index
│   ├── messageDelete.js     drops entries + orphaned answers
│   └── interactionCreate.js slash + feedback-button dispatcher
├── features/
│   ├── embedder.js          Xenova/transformers wrapper + LRU cache
│   ├── question-detector.js heuristic classifier
│   ├── index-store.js       in-memory vectors, atomic JSON snapshots
│   └── importer.js          channel history backfill (batched embeddings)
└── test-smoke.js            no-Discord integration test

data/                        (gitignored, runtime data)
├── guild-configs.json       per-guild settings
├── index/<guildId>.json     one file per guild with vectors + answers
└── models/                  cached embedding weights
```

## Design choices

| Decision | Why |
|---|---|
| **No SQLite** | JSON snapshots fit the ≤10k-question scale; one file per guild is debuggable (`cat` it). Avoids the build-on-Alpine pain of `sqlite-vss`. |
| **No Pinecone / Weaviate / Qdrant** | Would mean another service + cost + API key for every operator. Maven is meant to be self-contained. |
| **No OpenAI embeddings** | `all-MiniLM-L6-v2` is plenty for question similarity, runs entirely local, zero per-token cost, no rate limits, no data leaves the bot. |
| **Atomic snapshot writes** | `write tmp → rename` is atomic on POSIX, so a crash mid-write can never produce a corrupt index. |
| **Embedding LRU cache** | Back-to-back operations on the same text (search-then-index in `messageCreate`) cost one model call instead of two. |
| **Heuristic question detection** | A classifier would add 100MB+ for marginal gain. The current rules catch ~95% of natural questions with near-zero false positives. |

## Privacy

Maven stores: the **text of detected questions**, message/channel/user
IDs, a 384-dim embedding vector per question, the **text of replies that
follow** indexed questions, and feedback counters. Nothing else.

No external APIs are called for embedding or storage. The bot's entire
stack runs locally on the host you give it.

To wipe a guild's data: stop the bot, delete `data/index/<guildId>.json`,
restart.

## License

MIT. Part of the [GuildLabs](https://guildlabs.vercel.app) studio.
