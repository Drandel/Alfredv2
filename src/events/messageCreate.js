import { Events } from 'discord.js';
import { config } from '../config.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = message.client.prefixCommands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(`Error executing ${config.prefix}${commandName}:`, error);
      await message.reply('Something went wrong running that command.');
    }
  },
};
