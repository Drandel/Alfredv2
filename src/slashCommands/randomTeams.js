import { SlashCommandBuilder } from 'discord.js';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatTeamsTable(team1, team2) {
  const maxLength = Math.max(...[...team1, ...team2].map(n => n.length)) + 5;
  const maxRows = Math.max(team1.length, team2.length);

  let table = `Team 1${' '.repeat(maxLength - 5)}| Team 2\n`;
  table += `${'-'.repeat(maxLength)}+${'-'.repeat(maxLength)}\n`;

  for (let i = 0; i < maxRows; i++) {
    const left = team1[i] || '';
    const right = team2[i] || '';
    table += `${left}${' '.repeat(maxLength - left.length)}| ${right}\n`;
  }

  return table;
}

export default {
  data: new SlashCommandBuilder()
    .setName('randomteams')
    .setDescription('Split players into two random teams')
    .addStringOption(option =>
      option
        .setName('players')
        .setDescription('Comma-separated list of player names (leave empty to use your voice channel)')
        .setRequired(false),
    ),
  async execute(interaction) {
    const playersOption = interaction.options.getString('players');
    let players;

    if (playersOption) {
      players = playersOption.split(',').map(name => name.trim()).filter(name => name.length > 0);
    } else {
      const voiceChannel = interaction.member.voice?.channel;

      if (!voiceChannel) {
        return interaction.reply({
          content: 'You need to either provide player names or be in a voice channel.',
          ephemeral: true,
        });
      }

      players = voiceChannel.members
        .filter(member => !member.user.bot)
        .map(member => member.displayName);
    }

    if (players.length < 2) {
      return interaction.reply({
        content: 'Need at least 2 players to make teams.',
        ephemeral: true,
      });
    }

    const shuffled = shuffleArray(players);
    const mid = Math.ceil(shuffled.length / 2);
    const team1 = shuffled.slice(0, mid);
    const team2 = shuffled.slice(mid);

    const table = formatTeamsTable(team1, team2);
    await interaction.reply(`\`\`\`\n${table}\`\`\``);
  },
};
