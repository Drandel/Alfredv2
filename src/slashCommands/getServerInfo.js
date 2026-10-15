import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { queryServer, isConfigured, connectAddress } from '../services/enshroudedQuery.js';
import * as storage from '../services/enshroudedStorage.js';

// Live name if the server answers, otherwise the last name the monitor saw.
async function lookupServer() {
  try {
    const { name, password } = await queryServer();
    return { name, password };
  } catch {
    return { name: storage.get().name, password: null };
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('getserverinfo')
    .setDescription('Get the Enshrouded server name and IP so you can join'),

  async execute(interaction) {
    if (!isConfigured()) {
      return interaction.reply({ content: 'The Enshrouded server isn\'t configured on this bot.', ephemeral: true });
    }

    await interaction.deferReply();

    const { name, password } = await lookupServer();
    const address = connectAddress();

    const embed = new EmbedBuilder()
      .setTitle('🌫️ Join the Enshrouded Server')
      .setColor(0x2ecc71)
      .addFields(
        { name: 'Server Name', value: `\`\`\`${name || 'Unknown'}\`\`\`` },
        { name: 'IP Address', value: `\`\`\`${address}\`\`\`` },
      )
      .setFooter({ text: 'Search the name in the in-game server browser, or connect by IP' });

    if (password) {
      embed.addFields({ name: 'Password', value: '🔒 Required — ask an admin' });
    }

    const buttons = [
      new ButtonBuilder().setCustomId('getserverinfo:ip').setLabel('Copy IP').setEmoji('📋').setStyle(ButtonStyle.Primary),
    ];
    if (name) {
      buttons.unshift(
        new ButtonBuilder().setCustomId('getserverinfo:name').setLabel('Copy Name').setEmoji('📋').setStyle(ButtonStyle.Secondary),
      );
    }

    return interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(buttons)] });
  },

  // Discord bots can't write to the clipboard, so reply privately with just the value —
  // long-press → Copy Text (mobile) or triple-click (desktop) grabs it cleanly.
  async handleButton(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const action = interaction.customId.split(':')[1];
    const value = action === 'name' ? (await lookupServer()).name : connectAddress();
    return interaction.editReply(value || 'Server name unavailable right now.');
  },
};
