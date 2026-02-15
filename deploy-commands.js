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

if (config.guildIds.length > 0) {
  for (const guildId of config.guildIds) {
    const route = Routes.applicationGuildCommands(config.clientId, guildId);
    const data = await rest.put(route, { body: commands });
    console.log(`Deployed ${data.length} command(s) to guild ${guildId}`);
  }
} else {
  const route = Routes.applicationCommands(config.clientId);
  const data = await rest.put(route, { body: commands });
  console.log(`Deployed ${data.length} command(s) globally`);
}
