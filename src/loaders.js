import { readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');

async function importAll(dir) {
  const files = readdirSync(dir).filter(f => f.endsWith('.js'));
  const modules = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const mod = await import(pathToFileURL(filePath).href);
    modules.push(mod.default ?? mod);
  }
  return modules;
}

export async function loadSlashCommands(client) {
  const dir = path.join(__dirname, 'commands');
  const commands = await importAll(dir);
  for (const cmd of commands) {
    client.commands.set(cmd.data.name, cmd);
  }
  console.log(`Loaded ${client.commands.size} slash command(s)`);
}

export async function loadPrefixCommands(client) {
  const dir = path.join(__dirname, 'prefixCommands');
  const commands = await importAll(dir);
  for (const cmd of commands) {
    client.prefixCommands.set(cmd.name, cmd);
  }
  console.log(`Loaded ${client.prefixCommands.size} prefix command(s)`);
}

export async function loadEvents(client) {
  const dir = path.join(__dirname, 'events');
  const events = await importAll(dir);
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
  console.log(`Loaded ${events.length} event(s)`);
}
