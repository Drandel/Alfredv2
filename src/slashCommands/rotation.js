import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

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
    const buildSelectRow = (currentSelectedIds) => {
      const updatedOptions = members.map(member => ({
        label: member.displayName,
        value: member.id,
        default: currentSelectedIds.includes(member.id),
      }));
      const menu = new StringSelectMenuBuilder()
        .setCustomId('rotation-select')
        .setPlaceholder('Select players for the rotation')
        .setMinValues(2)
        .setMaxValues(members.size)
        .addOptions(updatedOptions);
      return new ActionRowBuilder().addComponents(menu);
    };

    const submitButton = new ButtonBuilder()
      .setCustomId('rotation-submit')
      .setLabel('Generate Rotation')
      .setStyle(ButtonStyle.Primary);

    const buttonRow = new ActionRowBuilder().addComponents(submitButton);

    // Track current selections (start with all members selected)
    let selectedIds = members.map(member => member.id);

    const reply = await interaction.reply({
      content: `**Select players for the rotation** (${selectedIds.length} selected):\nDeselect anyone you want to exclude, then hit **Generate Rotation**.`,
      components: [buildSelectRow(selectedIds), buttonRow],
      ephemeral: true,
    });

    const collector = reply.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60_000,
    });

    collector.on('collect', async (i) => {
      try {
        if (i.customId === 'rotation-select') {
          selectedIds = i.values;
          await i.update({
            content: `**Select players for the rotation** (${selectedIds.length} selected):\nDeselect anyone you want to exclude, then hit **Generate Rotation**.`,
            components: [buildSelectRow(selectedIds), buttonRow],
          });
        } else if (i.customId === 'rotation-submit') {
          await i.deferUpdate();
          collector.stop('submitted');

          const selectedPlayers = selectedIds.map(id => {
            const member = members.get(id);
            return member ? member.displayName : id;
          });

          await i.editReply({
            content: 'Rotation generated!',
            components: [],
          });
          await interaction.followUp(formatRotation(selectedPlayers));
        }
      } catch (err) {
        console.error('Rotation collector error:', err);
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason !== 'submitted') {
        try {
          await interaction.editReply({
            content: 'Rotation selection timed out.',
            components: [],
          });
        } catch {
          // Interaction token may have expired — nothing to do
        }
      }
    });
  },
};
