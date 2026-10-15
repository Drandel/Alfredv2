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
  roast: {
    emoji: '🔥',
    description: 'Roast someone in the server. Pick a target and let Alfred do the rest. No mercy.',
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
  rotation: {
    emoji: '🔄',
    description: [
      'Generate a random player rotation order.',
      '',
      '**Two ways to use:**',
      '• `/rotation` — Shows a menu of your voice channel members to pick from (all pre-selected)',
      '• `/rotation players: Dean, Sergio, Aidan` — Use a custom list of names (skips the menu)',
    ].join('\n'),
  },
  gamenews: {
    emoji: '🎮',
    description: [
      'Track Steam game news and post updates automatically.',
      '',
      '**Subcommands:**',
      '• `/gamenews enable #channel` — Enable auto-checking and set where news is posted',
      '• `/gamenews disable` — Turn off automatic news checking',
      '• `/gamenews add [appId]` — Add a Steam game by its App ID',
      '• `/gamenews remove [appId]` — Remove a game from tracking',
      '• `/gamenews list` — Show tracked games and current settings',
      '• `/gamenews check` — Manually check for new articles right now',
    ].join('\n'),
  },
  enshrouded: {
    emoji: '🌫️',
    description: [
      'Check on the Enshrouded game server.',
      '',
      '• `/enshrouded status` — Query the server right now: online/offline, player count, and version',
      '• `/enshrouded restart` — Restart the server (whitelisted users only, with a confirm step and a 5-minute cooldown)',
      '',
      'Alfred also keeps a live status message in the server channel that updates whenever the server goes up or down or the player count changes.',
    ].join('\n'),
  },
  getserverinfo: {
    emoji: '🔗',
    description: 'Get the Enshrouded server name and IP address so you can join. Includes **Copy Name** / **Copy IP** buttons that send you just the value, ready to copy.',
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
