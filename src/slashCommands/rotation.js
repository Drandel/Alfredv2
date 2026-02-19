import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatRotation(players) {
  const shuffled = shuffleArray(players);
  return `🔄 **Rotation Order:**\n${shuffled.join(' → ')}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('rotation')
    .setDescription('Generate a random player rotation order')
    .addStringOption(option =>
      option
        .setName('players')
        .setDescription('Comma-separated list of player names (leave empty to use your voice channel)')
        .setRequired(false),
    ),
  async execute(interaction) {
    const playersOption = interaction.options.getString('players');

    // Direct player list provided — skip menu, go straight to rotation
    if (playersOption) {
      const players = playersOption.split(',').map(name => name.trim()).filter(name => name.length > 0);

      if (players.length < 2) {
        return interaction.reply({
          content: 'Need at least 2 players to make a rotation.',
          ephemeral: true,
        });
      }

      return interaction.reply(formatRotation(players));
    }

    // No players provided — check voice channel
    const voiceChannel = interaction.member.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: 'You need to either provide player names or be in a voice channel.',
        ephemeral: true,
      });
    }

    const members = voiceChannel.members.filter(member => !member.user.bot);

    if (members.size < 2) {
      return interaction.reply({
        content: 'Need at least 2 non-bot members in your voice channel.',
        ephemeral: true,
      });
    }

    // Build interactive select menu with all members pre-selected
    const options = members.map(member => ({
      label: member.displayName,
      value: member.id,
      default: true,
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('rotation-select')
      .setPlaceholder('Select players for the rotation')
      .setMinValues(2)
      .setMaxValues(options.length)
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const reply = await interaction.reply({
      content: '**Select players for the rotation:**\nDeselect anyone you want to exclude, then submit.',
      components: [row],
      ephemeral: true,
    });

    try {
      const selection = await reply.awaitMessageComponent({
        filter: i => i.customId === 'rotation-select' && i.user.id === interaction.user.id,
        time: 60_000,
      });

      // Map selected member IDs back to display names
      const selectedPlayers = selection.values.map(id => {
        const member = members.get(id);
        return member ? member.displayName : id;
      });

      // Remove the ephemeral menu and send a public message with the result
      await selection.update({
        content: 'Rotation generated!',
        components: [],
      });
      await interaction.channel.send(formatRotation(selectedPlayers));
    } catch {
      await interaction.editReply({
        content: 'Rotation selection timed out.',
        components: [],
      });
    }
  },
};
