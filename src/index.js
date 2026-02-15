import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { loadSlashCommands, loadPrefixCommands, loadEvents } from './loaders.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Attach command collections to the client for use in event handlers
client.commands = new Collection();
client.prefixCommands = new Collection();

await loadSlashCommands(client);
await loadPrefixCommands(client);
await loadEvents(client);

client.login(config.token);
