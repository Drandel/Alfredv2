import { EmbedBuilder } from 'discord.js';

const COLORS = {
  online: 0x2ecc71,
  offline: 0xe74c3c,
  unknown: 0x95a5a6,
  restarting: 0xf1c40f,
};

function unix(ms) {
  return Math.floor(ms / 1000);
}

/**
 * view: { online: true|false|null, name, version, playerCount, maxPlayers, players, since, restarting? }
 */
export function buildStatusEmbed(view, footer) {
  if (view.restarting) {
    return buildRestartingEmbed(view, footer);
  }

  const stateLabel = view.online === true ? '🟢 Online' : view.online === false ? '🔴 Offline' : '⚪ Checking…';
  const color = view.online === true ? COLORS.online : view.online === false ? COLORS.offline : COLORS.unknown;

  const embed = new EmbedBuilder()
    .setTitle(view.name || 'Enshrouded Server')
    .setColor(color)
    .addFields({ name: 'Status', value: stateLabel, inline: true });

  if (view.since && view.online !== null) {
    embed.setDescription(`${view.online ? 'Online' : 'Offline'} since <t:${unix(view.since)}:R>`);
  }
  if (view.online) {
    embed.addFields({ name: 'Players', value: `${view.playerCount}/${view.maxPlayers ?? '?'}`, inline: true });
  }
  if (view.version) {
    embed.addFields({ name: 'Version', value: view.version, inline: true });
  }

  // Enshrouded currently reports blank player names; list them only if that ever changes.
  const names = (view.players ?? []).map(p => p.name).filter(Boolean);
  if (view.online && names.length > 0) {
    embed.addFields({ name: 'Online Now', value: names.join('\n').slice(0, 1024) });
  }
  if (footer) {
    embed.setFooter({ text: footer });
  }

  return embed;
}

function buildRestartingEmbed(view, footer) {
  const { userId, requestedAt } = view.restarting;
  const embed = new EmbedBuilder()
    .setTitle(view.name || 'Enshrouded Server')
    .setColor(COLORS.restarting)
    .setDescription(`Restart requested by <@${userId}> <t:${unix(requestedAt)}:R>`)
    .addFields({ name: 'Status', value: '🟡 Restarting…', inline: true });

  if (footer) {
    embed.setFooter({ text: footer });
  }
  return embed;
}
