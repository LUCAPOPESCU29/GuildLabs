# Beacon

**Get found.** Beacon gives any Discord server a live public page and lists it
in a directory ranked by real activity — who's online, who's growing, what's
on the calendar. There is no bump command, and there never will be.

Discord's own Server Discovery needs roughly 1,000 members. Beacon is for every
server below that line.

- One slash command creates the page; one more lists it.
- Counts, events, and growth update themselves from the Discord API.
- No privileged intents, no AI, no third-party services — just Discord + Node.
- Open source (MIT) and self-hostable in a single container with a single data folder.

> **Hosted vs self-host.** GuildLabs runs the official instance. Self-hosters get
> the identical product with their *own* directory — your instance lists the
> servers that add *your* bot. Nothing phones home.

## Commands

| Command | Who | What |
|---|---|---|
| `/beacon setup` | Manage Server | Create or edit the page: tagline + description (modal), 1–5 tags, and the channel the invite opens to |
| `/beacon publish` / `unpublish` | Manage Server | List or delist in the directory (the page stays reachable by link while unlisted) |
| `/beacon slug <slug>` | Manage Server | Customise the link: `/s/<slug>` — 3–32 lowercase letters, numbers, hyphens |
| `/beacon banner <image>` | Manage Server | Upload a PNG/JPG/WebP banner up to 2 MB |
| `/beacon preview` | Manage Server | See the page as an embed |
| `/beacon stats` | Manage Server | Views, join clicks, invite uses (when measurable), growth, and rank per tag |
| `/beacon digest <channel> <on\|off>` | Manage Server | A weekly stats digest every Monday |
| `/beacon remove` | Manage Server | Delete the page, its stats, and its banner (with confirmation) |
| `/beacon-admin …` | instance admins | `delist`, `ban`, `unban`, `feature`, `unfeature` a server by ID |

`/beacon-admin` only works for the user IDs in `BEACON_ADMIN_USER_IDS`, regardless
of Discord permissions.

## Quick start

### 1. Create the Discord application

1. <https://discord.com/developers/applications> → **New Application** → name it **Beacon**
2. **Bot** → **Reset Token** → copy it (`DISCORD_TOKEN`)
3. **General Information** → copy the **Application ID** (`CLIENT_ID`)

No privileged intents are needed — leave Presence, Server Members, and Message
Content off. Beacon only uses `Guilds` and `GuildScheduledEvents`.

### 2. Invite it

Replace `CLIENT_ID` and open:

```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=19457&scope=bot+applications.commands
```

`19457` = Create Invite + View Channels + Send Messages + Embed Links — the
minimum. Use **`19489`** instead to add *Manage Server*, which lets `/beacon stats`
report **real invite uses** on top of join clicks. Everything else works without it.

### 3. Configure and run

```bash
npm install
cp .env.example .env     # fill in DISCORD_TOKEN, CLIENT_ID, BEACON_PUBLIC_URL
npm start
```

Beacon boots the bot and the web server in one process on `PORT` (default
`8080`). Open <http://localhost:8080> — that's your directory. Slash commands
are registered globally on startup; set `DEV_GUILD_ID` while developing so they
appear instantly in one server instead of taking up to an hour everywhere.

Requires **Node 22.13+** (storage uses the built-in `node:sqlite`, so there is
nothing native to compile).

## Self-host with Docker

```bash
cp .env.example .env     # fill it in
docker compose up -d     # builds the image, mounts a volume at /data
```

Or without compose:

```bash
docker build -t beacon .
docker run -d --name beacon --restart unless-stopped \
  --env-file .env -e DATA_DIR=/data -v beacon-data:/data -p 8080:8080 beacon
```

`/data` holds `beacon.sqlite` and uploaded banners. Back it up; nothing else is
stateful. `GET /health` returns `{ ok, bot, ws, guilds, published }` — `ws: 0`
means the gateway is connected.

### Behind a reverse proxy

Set `BEACON_PUBLIC_URL` to the address people will use, then point your proxy at
port 8080. Caddy, for example:

```
beacon.example.com {
    reverse_proxy localhost:8080
}
```

Beacon trusts one proxy hop (`X-Forwarded-For`) for rate limiting and view
counting.

### Fly.io

```bash
fly launch --no-deploy                                  # uses fly.toml
fly volumes create beacon_data --size 1 --region iad
fly secrets set DISCORD_TOKEN=… CLIENT_ID=… BEACON_PUBLIC_URL=https://your-app.fly.dev
fly deploy
```

The machine must stay running (`auto_stop_machines = false`) because it holds
the gateway connection and runs the hourly jobs.

### Railway

Create a service from this directory; `railway.json` sets the start command and
health check. Add a volume mounted at `/data`, set `DATA_DIR=/data`, and add the
same secrets as above.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `DISCORD_TOKEN` | — | Bot token (required) |
| `CLIENT_ID` | — | Application ID (required) |
| `PORT` | `8080` | Web server port |
| `DATA_DIR` | `./data` | SQLite database + uploaded banners |
| `BEACON_PUBLIC_URL` | `http://localhost:8080` | Absolute base URL for links, sitemap, Open Graph |
| `BEACON_SITE_NAME` | `Beacon` | Name shown in the nav and page titles |
| `BEACON_FOOTER_TEXT` | — | Replaces the default footer line |
| `BEACON_REPORT_EMAIL` | — | Adds a "Report this server" link to every page |
| `BEACON_ADMIN_USER_IDS` | — | Comma-separated user IDs allowed to run `/beacon-admin` |
| `DIGEST_HOUR_UTC` | `9` | Hour (UTC) the Monday digest posts |
| `DEV_GUILD_ID` | — | Register commands to one guild for instant updates |

## How ranking works

Every server's score is computed from data the bot reads itself:

```
score = 0.45 · online ratio            (online ÷ members, 0–1)
      + 0.25 · growth this week        (members gained ÷ 50, capped at 1)
      + 0.20 · upcoming events         (min(events, 3) ÷ 3)
      + 0.10 · page views this week    (log-scaled, saturates at 1,000)
```

Featured servers (set by an instance admin) sort first within a tag. Nothing
else moves a server up. **There is no bump command** because bump-driven
directories reward whoever spams a button most often, not whoever runs the best
community — and the servers Beacon exists for can't win that game.

Member and online counts are sampled every few hours (and refreshed when a page
is getting traffic). Within a day the *latest* member count and the *peak* online
count are kept, so a server isn't punished for being sampled at 4 am.

## What's measured, honestly

- **Views** — one per visitor per hour, de-duplicated with a salted hash of IP +
  user agent. The salt lives in memory and rotates daily; no IP is ever stored.
  Known crawlers are ignored.
- **Join clicks** — every click on the Join button (`/s/<slug>/join`) before it
  redirects to the invite. Always available.
- **Invite uses** — only when the bot has *Manage Server*; read daily from the
  invite itself. Labelled separately and never presented as "joins".

## Data retention

- Samples, hits, and invite-use history are kept for **90 days**.
- When the bot is removed from a server, its page is unlisted immediately and
  all of its data (including the banner) is purged after **30 days**.
- `/beacon remove` deletes everything immediately.

Age-restricted servers (Discord's NSFW level) can have a page by link but are
never listed in the directory.

## Development

```
src/index.js          boots everything
src/commands/         /beacon and /beacon-admin
src/flows/            the multi-step setup + remove conversations
src/events/           ready, guildCreate, guildDelete, guildUpdate, interactionCreate
src/jobs/             sample (counts), invites (keep-alive), digest (weekly)
src/lib/              config, db, store, ranking, tags, slug, html, discord-data
src/web/              express app, routes, views, one stylesheet
test/                 vitest — unit tests + the web app against in-memory SQLite
```

```bash
npm test      # unit + integration
npm run dev   # restart on file change
```

The web layer never requires a Discord connection, so every public page can be
exercised in tests with `client: null`.

## Contributing

Issues and pull requests are welcome in the GuildLabs repository. Keep the
no-bump policy, keep the intents non-privileged, and keep every user string
going through `esc()`.

## Security

Report vulnerabilities privately to the GuildLabs maintainers rather than in a
public issue. Beacon stores no personal data beyond what server admins type into
`/beacon setup`.

## License

MIT — see [LICENSE](./LICENSE).
