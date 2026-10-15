import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config.js';
import { queryServer, isConfigured } from '../services/enshroudedQuery.js';
import { buildStatusEmbed } from '../services/enshroudedEmbeds.js';
import * as pterodactyl from '../services/pterodactyl.js';
import * as monitor from '../services/enshroudedMonitor.js';

const RESTART_COOLDOWN = 5 * 60 * 1000; // 5 minutes
const CONFIRM_WINDOW = 60 * 1000; // confirm buttons expire after 1 minute

let lastRestartAt = 0;

// Returns an error message if this user can't restart right now, otherwise null.
function restartBlockedReason(userId) {
  if (!pterodactyl.isConfigured()) {
    return 'Server restarts aren\'t configured on this bot.';
  }
  if (!config.enshrouded.restartUserIds.includes(userId)) {
    return 'You\'re not allowed to restart the server.';
  }
  const remaining = lastRestartAt + RESTART_COOLDOWN - Date.now();
  if (remaining > 0) {
    return `The server was restarted recently. Try again <t:${Math.ceil((Date.now() + remaining) / 1000)}:R>.`;
  }
  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName('enshrouded')
    .setDescription('Enshrouded game server tools')
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Check the Enshrouded server right now'),
    )
    .addSubcommand(sub =>
      sub
        .setName('restart')
        .setDescription('Restart the Enshrouded server (whitelisted users only)'),
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
        view = { ...snapshot, online: true };
      } catch (err) {
        console.warn('[Enshrouded] On-demand query failed:', err.message);
        view = { online: false };
      }

      return interaction.editReply({ embeds: [buildStatusEmbed(view, 'On-demand check')] });
    }

    if (sub === 'restart') {
      const blocked = restartBlockedReason(interaction.user.id);
      if (blocked) {
        if (!config.enshrouded.restartUserIds.includes(interaction.user.id)) {
          console.warn(`[Enshrouded] Restart denied for ${interaction.user.tag} (${interaction.user.id})`);
        }
        return interaction.reply({ content: blocked, ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('enshrouded:restart-confirm').setLabel('Restart').setEmoji('🔄').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('enshrouded:restart-cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
      );

      return interaction.reply({
        content: '⚠️ Restart the Enshrouded server? Anyone playing will be disconnected for a few minutes.',
        components: [row],
        ephemeral: true,
      });
    }
  },

  async handleButton(interaction) {
    const action = interaction.customId.split(':')[1];

    if (action === 'restart-cancel') {
      return interaction.update({ content: 'Restart cancelled.', components: [] });
    }

    if (action === 'restart-confirm') {
      // Re-check everything: the whitelist or cooldown may have changed since the prompt was shown
      const blocked = restartBlockedReason(interaction.user.id);
      if (blocked) {
        return interaction.update({ content: blocked, components: [] });
      }
      if (Date.now() - interaction.message.createdTimestamp > CONFIRM_WINDOW) {
        return interaction.update({ content: 'That confirmation expired. Run `/enshrouded restart` again.', components: [] });
      }

      lastRestartAt = Date.now();
      await interaction.update({ content: '🔄 Sending restart…', components: [] });

      try {
        await pterodactyl.sendPowerSignal('restart');
      } catch (err) {
        lastRestartAt = 0;
        console.error('[Enshrouded] Restart failed:', err.message);
        return interaction.editReply(`❌ Restart failed: ${err.message}`);
      }

      console.log(`[Enshrouded] Restart requested by ${interaction.user.tag} (${interaction.user.id})`);
      monitor.markRestarting(interaction.user.id);
      return interaction.editReply('✅ Restart sent. The server usually takes a few minutes to come back — watch the status message.');
    }
  },
};
