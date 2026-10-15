import { SlashCommandBuilder } from 'discord.js';
import { queryServer, isConfigured } from '../services/enshroudedQuery.js';
import { buildStatusEmbed } from '../services/enshroudedEmbeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('enshrouded')
    .setDescription('Enshrouded game server tools')
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Check the Enshrouded server right now'),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      if (!isConfigured()) {
        return interaction.reply({ content: 'The Enshrouded server isn\'t configured on this bot.', ephemeral: true });
      }

      await interaction.deferReply();

      let view;
      try {
        const snapshot = await queryServer();
        view = { ...snapshot, online: true, checkedAt: Date.now() };
      } catch (err) {
        console.warn('[Enshrouded] On-demand query failed:', err.message);
        view = { online: false, checkedAt: Date.now() };
      }

      return interaction.editReply({ embeds: [buildStatusEmbed(view, 'On-demand check')] });
    }
  },
};
