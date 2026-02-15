import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as storage from '../services/steamNewsStorage.js';
import * as checker from '../services/steamNewsChecker.js';

function requireManageServer(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return 'You need the **Manage Server** permission to use this subcommand.';
  }
  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName('gamenews')
    .setDescription('Track Steam game news in your server')
    .addSubcommand(sub =>
      sub
        .setName('enable')
        .setDescription('Enable auto-checking and set the announcement channel')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel to post news in')
            .setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('disable')
        .setDescription('Disable automatic news checking'),
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Add a Steam game to track')
        .addStringOption(opt =>
          opt
            .setName('appid')
            .setDescription('Steam App ID (e.g. 730 for CS2)')
            .setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a game from tracking')
        .addStringOption(opt =>
          opt
            .setName('appid')
            .setDescription('Steam App ID to remove')
            .setRequired(true),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('Show tracked games and settings'),
    )
    .addSubcommand(sub =>
      sub
        .setName('check')
        .setDescription('Manually check for new game news now'),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'enable') {
      const denied = requireManageServer(interaction);
      if (denied) return interaction.reply({ content: denied, ephemeral: true });

      const channel = interaction.options.getChannel('channel');
      storage.setEnabled(guildId, true, channel.id);
      return interaction.reply(`Steam news auto-checking **enabled**. News will be posted to ${channel}.`);
    }

    if (sub === 'disable') {
      const denied = requireManageServer(interaction);
      if (denied) return interaction.reply({ content: denied, ephemeral: true });

      storage.setEnabled(guildId, false);
      return interaction.reply('Steam news auto-checking **disabled**.');
    }

    if (sub === 'add') {
      const denied = requireManageServer(interaction);
      if (denied) return interaction.reply({ content: denied, ephemeral: true });

      const appId = interaction.options.getString('appid');
      await interaction.deferReply();

      const name = await checker.fetchGameName(appId);
      if (!name) {
        return interaction.editReply(`Could not find a Steam game with App ID \`${appId}\`. Double-check the ID.`);
      }

      const added = storage.addGame(guildId, appId, name);
      if (!added) {
        return interaction.editReply(`**${name}** (\`${appId}\`) is already being tracked.`);
      }

      await checker.seedExistingNews(guildId, appId);
      return interaction.editReply(`Now tracking **${name}** (\`${appId}\`). Existing news has been marked as seen.`);
    }

    if (sub === 'remove') {
      const denied = requireManageServer(interaction);
      if (denied) return interaction.reply({ content: denied, ephemeral: true });

      const appId = interaction.options.getString('appid');
      const guildConfig = storage.getGuild(guildId);
      const game = guildConfig.games.find(g => g.appId === appId);

      const removed = storage.removeGame(guildId, appId);
      if (!removed) {
        return interaction.reply({ content: `No game with App ID \`${appId}\` is being tracked.`, ephemeral: true });
      }

      return interaction.reply(`Removed **${game.name}** (\`${appId}\`) from tracking.`);
    }

    if (sub === 'list') {
      const guildConfig = storage.getGuild(guildId);

      const status = guildConfig.enabled ? 'Enabled' : 'Disabled';
      const channel = guildConfig.channelId ? `<#${guildConfig.channelId}>` : 'Not set';

      let gameList = 'No games tracked.';
      if (guildConfig.games.length > 0) {
        gameList = guildConfig.games.map(g => `- **${g.name}** (\`${g.appId}\`)`).join('\n');
      }

      const embed = new EmbedBuilder()
        .setTitle('Steam News Tracker')
        .setColor(0x1b2838)
        .addFields(
          { name: 'Status', value: status, inline: true },
          { name: 'Channel', value: channel, inline: true },
          { name: 'Tracked Games', value: gameList },
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'check') {
      await interaction.deferReply();

      const guildConfig = storage.getGuild(guildId);
      if (guildConfig.games.length === 0) {
        return interaction.editReply('No games are being tracked. Use `/gamenews add` to add a game first.');
      }

      if (!guildConfig.channelId) {
        return interaction.editReply('No announcement channel set. Use `/gamenews enable #channel` first.');
      }

      const count = await checker.checkGuild(interaction.client, guildId, guildConfig);
      if (count > 0) {
        return interaction.editReply(`Found and posted **${count}** new article${count === 1 ? '' : 's'}.`);
      }
      return interaction.editReply('No new news articles found.');
    }
  },
};
