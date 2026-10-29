# Forget

A Discord helper bot dedicated to a single server. It finds your staff channel on
its own and posts beautiful, AI-written embeds.

## Setup

### 1. Create the Discord application

1. Go to <https://discord.com/developers/applications> → **New Application**, name it **Forget**
2. **Bot** tab → **Reset Token** → copy the token
3. **General Information** → copy the **Application ID**

No privileged intents needed — Forget only posts embeds.

### 2. Invite it to your server

Replace `APPLICATION_ID` and open:

```
https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&permissions=274877991936&scope=bot+applications.commands
```

That permission integer is View Channels + Send Messages + Embed Links + Read History —
the minimum Forget needs. It deliberately does *not* ask for Administrator.

### 3. Fill in `.env`

```
DISCORD_TOKEN=…      # from step 1
CLIENT_ID=…          # application ID
GUILD_ID=…           # your server ID (right-click server → Copy Server ID)
GROQ_API_KEY=…       # optional; without it Forget uses fallback copy
```

`GUILD_ID` keeps commands scoped to your server and makes registration instant.

### 4. Register + run

```bash
npm install
npm run deploy   # register /forget
npm start        # or: npm run dev
```

## Commands

| Command | What it does |
|---|---|
| `/forget scan` | Shows which channel it thinks is staff, with scores and reasoning |
| `/forget channel #x` | Pins the staff channel so it stops guessing |
| `/forget post kind:… [about:…] [channel:…]` | Writes an embed and posts it |

`kind` is one of: Staff briefing (staff-only), Welcome message, Rules card, Announcement.
All subcommands require **Manage Server**; replies are ephemeral.

## How staff detection works

Name matching alone is wrong (`#staff-applications` is public); permission analysis
alone is wrong (`#vip-lounge` is private but not staff). So `lib/staff-channels.js`
scores both — name hints, penalties for public-sounding names, hidden-from-@everyone,
and granted-to-a-moderator-role. Below a confidence threshold it refuses to guess
rather than risk posting staff content publicly.

## Notes

- AI copy is constrained: it may not invent numbers, and invented `#channel` /
  `@role` references are stripped against the guild's real names before posting.
- If Groq is unavailable the embed still posts, using fallback copy, footer-labelled
  `offline mode`.
- Model is `openai/gpt-oss-120b` with `reasoning_effort: "low"` (see `lib/ai.js`).
  Groq retires models periodically — if calls start failing, check the model is still
  listed at `https://api.groq.com/openai/v1/models`.
