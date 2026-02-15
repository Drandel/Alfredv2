# Alfred v2

Custom Discord bot built with discord.js v14 and vanilla Node.js (ESM).

## Project Structure

```
src/
├── index.js             # Entry point — creates the client and loads everything
├── config.js            # Reads environment variables from .env
├── loaders.js           # Auto-discovers and registers commands & events
├── commands/            # Slash commands — one file per command
├── prefixCommands/      # Prefix commands (!command) — one file per command
└── events/              # Discord event handlers — one file per event
deploy-commands.js       # Registers slash commands with the Discord API
```

Commands and events are loaded automatically from their folders at startup. No manual registration needed — just drop in a file.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your bot token and client ID (see [DEV_BOT_SERVER_INTEGRATION.md](DEV_BOT_SERVER_INTEGRATION.md) for full setup instructions):
   ```
   DISCORD_TOKEN=your-bot-token
   CLIENT_ID=your-application-id
   PREFIX=!
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

### Slash Command

Create a new file in `src/commands/` (e.g. `src/commands/hello.js`):

```js
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Says hello'),
  async execute(interaction) {
    await interaction.reply('Hello!');
  },
};
```

Then run `npm run deploy` to register it with Discord.

### Prefix Command

Create a new file in `src/prefixCommands/` (e.g. `src/prefixCommands/hello.js`):

```js
export default {
  name: 'hello',
  async execute(message, args) {
    await message.reply('Hello!');
  },
};
```

Prefix commands work immediately on restart — no deploy step needed.
