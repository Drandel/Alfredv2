import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const commandDetails = {
  help: {
    emoji: '📖',
    description: 'Shows this help menu with all available commands.',
  },
  ping: {
    emoji: '🏓',
    description: 'Check if Alfred is alive and measure bot + API latency.',
  },
  howisdavidtoday: {
    emoji: '🎲',
    description: 'Get a random status update on David. Covers topics including his mass, depression, music career, electrician skills, and War Thunder gameplay.',
  },
  randomteams: {
    emoji: '⚔️',
    description: [
      'Split players into two random teams.',
      '',
      '**Two ways to use:**',
      '• `/randomteams` — Automatically grabs everyone in your voice channel',
      '• `/randomteams players: Dean, David, John` — Use a custom list of names',
    ].join('\n'),
  },
};

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands'),
  async execute(interaction) {
    const commands = interaction.client.commands;

    const fields = commands.map(cmd => {
      const details = commandDetails[cmd.data.name] || {};
      const emoji = details.emoji || '▫️';
      const description = details.description || cmd.data.description;

      return {
        name: `${emoji}  /${cmd.data.name}`,
        value: description,
      };
    });

    const embed = new EmbedBuilder()
      .setTitle('🤵 Alfred — Command List')
      .setDescription('Here\'s everything I can do for you, sir.')
      .addFields(fields)
      .setColor(0x5865f2)
      .setFooter({ text: `${commands.size} commands available` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
