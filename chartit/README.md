# ChartIt

Live stock & crypto candlestick charts in Discord. Charts are rendered with
TradingView's [lightweight-charts](https://github.com/tradingview/lightweight-charts)
in a headless Chromium and posted as inline images.

> **Disclaimer:** ChartIt displays public market data for informational
> purposes only. It is **not financial advice** and does not place trades.
> Some quotes may be delayed depending on the exchange.

## Commands

| Command | Who | What |
|---|---|---|
| `/chart symbol range` | anyone | Candlestick chart + quote (price, change, volume, day range) + latest headlines |
| `/quote symbol` | anyone | Fast text-only quote |
| `/compare symbols range` | anyone | Overlay 2–5 tickers on one normalized **% change** chart |
| `/heatmap market` | anyone | Colorful market heatmap of daily % change (`stocks` or `crypto`) |
| `/news symbol` | anyone | Latest 3 headlines for a ticker |
| `/portfolio add\|remove\|show\|clear` | anyone (personal) | Your own per-user watchlist with live prices |
| `/watchlist add\|remove\|list\|channel\|interval\|range\|hours` | Manage Server | Auto-post charts to a channel on a schedule |
| `/alert add\|list\|remove` | Manage Server (DM alerts: anyone) | Cross-a-threshold alerts — ping a channel, or DM you personally |
| `/chartit` | anyone | Help |

Symbols: stocks/ETFs (`AAPL`, `SPY`), crypto (`BTC-USD`), indices (`^GSPC`).

**Alert targets:** `/alert add … target: DM me` creates a personal DM alert any
member can set (referenced as `P1`, `P2`, …); `target: this channel` is the
admin-gated channel alert (referenced as `#1`, `#2`, …).

**Personal data** (DM alerts, portfolios) lives in `data/users.json`, kept
separate from per-server config in `data/guild-configs.json`.

## Local setup

```bash
npm install
cp .env.example .env   # fill in DISCORD_TOKEN + CLIENT_ID
npm run deploy         # register slash commands (use DEV_GUILD_ID for instant)
npm start
```

Create the Discord app at <https://discord.com/developers/applications>. Invite
scope `bot applications.commands` with **Send Messages + Embed Links**.

## Deploy (Fly.io)

Separate app from Construct — `chartit-bot`.

```bash
fly launch --no-deploy            # uses fly.toml in this dir
fly volumes create chartit_data --size 1 --region iad
fly secrets set DISCORD_TOKEN=… CLIENT_ID=…
fly deploy
```

The machine must stay running (`auto_stop_machines = false`) because it holds
the gateway connection and runs the watchlist/alert cron jobs.

Charts render in a headless Chromium, so the machine needs ~1gb of RAM
(`fly.toml` sets this). An already-deployed machine must be scaled up once:
`fly scale memory 1024`.

## How it works

- `src/lib/yahoo.js` — quotes (`getQuote`/`getQuotes`) + history (`getHistory`), 30s quote cache.
- `src/lib/chart.js` — renders a candlestick chart with lightweight-charts in a headless Chromium (launched lazily, reused, idle-closed after 5 min) and returns a PNG buffer.
- `src/scheduler/` — two 1-minute cron jobs: watchlist auto-posts (gated by each guild's interval + market hours) and alert polling (one batched quote call, edge-triggered).
- `src/lib/config-store.js` — per-guild JSON store at `DATA_DIR/guild-configs.json`.
