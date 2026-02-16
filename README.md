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
| `DROPLET_USER`     | No       | SSH user for production deployment (default: `root`)                                                 |
| `DROPLET_IP`       | No       | IP address of the production server                                                                  |
| `APP_DIR`          | No       | App directory on the production server (default: `/root/Alfredv2`)                                   |
| `PM2_PROCESS_NAME` | No       | PM2 process name on the production server (default: `alfred`)                                        |
