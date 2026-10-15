# Alfred v2

Custom Discord bot built with discord.js v14 and vanilla Node.js (ESM).

## Project Structure

```
src/
├── index.js             # Entry point — creates the client and loads everything
├── config.js            # Reads environment variables from .env
├── loaders.js           # Auto-discovers and registers commands & events
├── slashCommands/       # Slash commands — one file per command
├── prefixCommands/      # Prefix commands (!command) — one file per command
├── services/            # Background services (e.g. Steam news tracker)
└── events/              # Discord event handlers — one file per event
scripts/
└── deploy-prod.sh       # Deploys to production (pull, install, deploy commands, restart)
deploy-commands.js       # Registers slash commands with the Discord API
```

Commands and events are loaded automatically from their folders at startup. No manual registration needed — just drop in a file.

## Prerequisites

- Node.js 22+
- A Discord bot application ([setup guide](DEV_BOT_SERVER_INTEGRATION.md))

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values (see [DEV_BOT_SERVER_INTEGRATION.md](DEV_BOT_SERVER_INTEGRATION.md) for full setup instructions):

   ```
   DISCORD_TOKEN=your-bot-token
   CLIENT_ID=your-application-id
   GUILD_IDS=comma,separated,guild,ids
   PREFIX=!
   STEAM_API_KEY=
   ENS_HOST=
   ENS_QUERY_PORT=
   ENS_CHANNEL_ID=
   DROPLET_USER=myUser
   APP_DIR=/path/to/app
   PM2_PROCESS_NAME=process_name
   ```

3. Register slash commands with Discord:

   ```bash
   npm run deploy
   ```

4. Start the bot:
   ```bash
   npm start
   ```

## Adding Commands

All `.js` files in the command directories are automatically discovered and registered at startup — just drop in a file and restart the bot.

### Slash Command

Create a new file in `src/slashCommands/` (e.g. `src/slashCommands/hello.js`):

```js
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("hello").setDescription("Says hello"),
  async execute(interaction) {
    await interaction.reply("Hello!");
  },
};
```

The bot picks it up on restart. You also need to run `npm run deploy` once to register the command with the Discord API so it shows up in the slash command menu.

### Prefix Command

Create a new file in `src/prefixCommands/` (e.g. `src/prefixCommands/hello.js`):

```js
export default {
  name: "hello",
  async execute(message, args) {
    await message.reply("Hello!");
  },
};
```

Prefix commands work immediately on restart — no deploy step needed since they don't register with the Discord API.

## Environment Variables

| Variable           | Required | Description                                                                                          |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `DISCORD_TOKEN`    | Yes      | Bot token from the Discord developer portal                                                          |
| `CLIENT_ID`        | Yes      | Application ID from the Discord developer portal                                                     |
| `GUILD_IDS`        | No       | Comma-separated guild IDs for guild-scoped command deployment. If omitted, commands deploy globally. |
| `PREFIX`           | No       | Prefix for text commands (default: `!`)                                                              |
| `STEAM_API_KEY`    | No       | Steam Web API key for `/gamenews` news tracking                                                      |
| `ENS_HOST`         | No       | Enshrouded server IP/hostname. Leave blank to disable the Enshrouded monitor.                        |
| `ENS_QUERY_PORT`   | No       | Enshrouded Steam query port (default: `15637`; Pine Hosting assigns its own — check the panel)        |
| `ENS_CHANNEL_ID`   | No       | Channel for the live status message and server events. Required for the background monitor.         |
| `ENS_POLL_INTERVAL_SECONDS` | No | How often to query the server, in seconds (default: `60`)                                         |
| `ENS_OFFLINE_THRESHOLD` | No  | Consecutive failed queries before the server is reported offline (default: `3`)                    |
| `DROPLET_USER`     | No       | SSH user for production deployment (default: `root`)                                                 |
| `DROPLET_IP`       | No       | IP address of the production server                                                                  |
| `APP_DIR`          | No       | App directory on the production server (default: `/root/Alfredv2`)                                   |
| `PM2_PROCESS_NAME` | No       | PM2 process name on the production server (default: `alfred`)                                        |

## Enshrouded Server Monitor

Alfred can watch an Enshrouded dedicated server over the Steam query protocol (A2S) using [gamedig](https://github.com/gamedig/node-gamedig). The bot doesn't need to run on the game server — it only needs outbound UDP access to the query port.

### What it does

- **Live status message** — one message in `ENS_CHANNEL_ID` that the bot edits in place every poll: online/offline, server name, player count vs max, version, how long each player has been connected, and when it was last updated. The message ID is saved in `data/enshrouded.json`, so it survives restarts.
- **Event posts** — the same channel gets a short post when the server goes offline, comes back online, or players join/leave.
- **Outage debounce** — the server is only reported offline after `ENS_OFFLINE_THRESHOLD` consecutive failed queries (default 3), so a single dropped UDP packet doesn't cause a false alarm.
- **`/enshrouded status`** — queries the server on demand and replies with the current status.

> **Player names aren't available.** Enshrouded answers A2S player queries with blank names, so join/leave posts are count-based ("A player joined — 2/8 online") and the status message lists players as "Player 1 · 42m".

### Setup

1. In the Pine Hosting panel, find the server's IP and **query port**. On Pine this is the allocated port shown next to the IP (e.g. `66.51.99.81:7784`), not Enshrouded's default `15637`.
2. Pick a channel for status updates and copy its ID (Developer Mode → right-click the channel → **Copy Channel ID**).
3. Make sure the bot has **View Channel**, **Send Messages**, **Embed Links**, and **Read Message History** in that channel.
4. Set the env vars and restart the bot:

   ```
   ENS_HOST=66.51.99.81
   ENS_QUERY_PORT=7784
   ENS_CHANNEL_ID=123456789012345678
   ```

To test the query from the bot's machine: `npx gamedig --type enshrouded --givenPortOnly 66.51.99.81:7784`. If it works locally but not on the VM, check the VM's outbound UDP firewall.

### Troubleshooting

- **Status message deleted?** The bot posts a new one on the next poll and remembers the new ID.
- **Channel unreachable or missing permissions?** The bot logs a `[Enshrouded]` warning and retries every poll — it won't crash.
- **Moving the status message?** Change `ENS_CHANNEL_ID` and restart; a new message is created in the new channel. Delete the old one by hand.

### Not supported: restarting the server from Discord

A `/enshrouded restart` command would need Pterodactyl client API keys, which Pine Hosting doesn't expose. `/enshrouded` uses subcommands so one can be added later if that changes.
