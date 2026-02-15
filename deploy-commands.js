import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';
import { config } from './src/config.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const commandsDir = path.join(__dirname, 'src', 'slashCommands');

const commands = [];
const files = readdirSync(commandsDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(commandsDir, file);
  const mod = await import(pathToFileURL(filePath).href);
  const command = mod.default ?? mod;
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(config.token);

console.log(`Deploying ${commands.length} slash command(s)...`);

// Registers commands globally (available in all servers the bot is in).
// Takes up to 1 hour to propagate. For instant updates during dev,
// use Routes.applicationGuildCommands(clientId, guildId) instead.
const data = await rest.put(
  Routes.applicationCommands(config.clientId),
  { body: commands },
);

console.log(`Successfully deployed ${data.length} slash command(s)`);
