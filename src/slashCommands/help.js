import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands'),
  async execute(interaction) {
    const commands = interaction.client.commands;

    const list = commands.map(cmd => `**/${cmd.data.name}** — ${cmd.data.description}`).join('\n');

    await interaction.reply({
      content: `Here's what I can do:\n\n${list}`,
      ephemeral: true,
    });
  },
};
