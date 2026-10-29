# Forge Discord Bot

The actual bot behind the Forge AI Server Builder. It reads your wizard's JSON blueprint and deploys it to a real Discord server.

## Quick Start

### 1. Create a Discord App

1. Go to https://discord.com/developers/applications
2. Click **New Application** → give it a name
3. Go to **Bot** → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - Server Members Intent
   - Message Content Intent
5. Copy the **Token**
6. Go to **OAuth2 → General** and copy the **Client ID**

### 2. Invite the Bot to Your Server

Go to this URL (replace `CLIENT_ID`):
```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot+applications.commands
```
Permission `8` = Administrator (needed to create channels/roles).

### 3. Configure Environment

```bash
cp .env.example .env
```
Edit `.env`:
```
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
DEV_GUILD_ID=your_server_id_here   # optional, for instant slash command updates
```

### 4. Register Slash Commands

```bash
npm run deploy
```

### 5. Start the Bot

```bash
npm start
# or with auto-restart on file changes:
npm run dev
```

---

## Slash Commands

| Command | Description |
|---|---|
| `/setup` | Upload a Forge blueprint JSON → creates all channels, roles & permissions |
| `/config welcome` | Set welcome channel + message |
| `/config verification` | Set up a verification gate |
| `/config antiraid` | Enable/disable anti-raid protection |
| `/config leveling` | Enable XP leveling system |
| `/config tickets` | Configure the ticket system |
| `/config show` | Show current server config |
| `/verify-panel` | Post a verify button in the verify channel |
| `/ticket` | Open a support ticket |
| `/rank` | Check your XP level |

---

## How Blueprint Deploy Works

1. Use the **Forge builder** at https://discord-ten-topaz.vercel.app
2. Complete the 6-step wizard
3. Click **Export JSON** and save the file
4. In your Discord server, run `/setup` and upload the JSON
5. The bot creates all categories, channels, roles and permissions in ~5 seconds

---

## Features

- **Welcome messages** — customizable embed when a member joins
- **Verification gate** — button-click verification assigns a role
- **Anti-raid** — detects mass joins, auto-kicks, 30s lockdown
- **XP Leveling** — earns 15-24 XP per message (60s cooldown), announces level-ups
- **Tickets** — private ticket channels per user, close button for support staff
