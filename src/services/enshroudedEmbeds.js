import { EmbedBuilder } from 'discord.js';

const COLORS = {
  online: 0x2ecc71,
  offline: 0xe74c3c,
  unknown: 0x95a5a6,
  join: 0x3498db,
  leave: 0x7f8c8d,
};

function unix(ms) {
  return Math.floor(ms / 1000);
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return '<1m';
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

function formatPlayerList(players) {
  const lines = players.map((p, i) => {
    const label = p.name ?? `Player ${i + 1}`;
    return p.seconds != null ? `• ${label} · ${formatDuration(p.seconds)}` : `• ${label}`;
  });
  const text = lines.join('\n');
  return text.length <= 1024 ? text : text.slice(0, 1020) + '\n…';
}

/**
 * view: { online: true|false|null, name, version, playerCount, maxPlayers, players, since, checkedAt }
 */
export function buildStatusEmbed(view, footer) {
  const stateLabel = view.online === true ? '🟢 Online' : view.online === false ? '🔴 Offline' : '⚪ Checking…';
  const color = view.online === true ? COLORS.online : view.online === false ? COLORS.offline : COLORS.unknown;

  const lines = [];
  if (view.since && view.online !== null) {
    lines.push(`${view.online ? 'Online' : 'Offline'} since <t:${unix(view.since)}:R>`);
  }
  lines.push(`Last updated <t:${unix(view.checkedAt)}:R>`);

  const embed = new EmbedBuilder()
    .setTitle(view.name || 'Enshrouded Server')
    .setDescription(lines.join('\n'))
    .setColor(color)
    .addFields({ name: 'Status', value: stateLabel, inline: true })
    .setTimestamp(view.checkedAt);

  if (view.online) {
    embed.addFields({ name: 'Players', value: `${view.playerCount}/${view.maxPlayers ?? '?'}`, inline: true });
  }
  if (view.version) {
    embed.addFields({ name: 'Version', value: view.version, inline: true });
  }
  if (view.online && view.players?.length > 0) {
    embed.addFields({ name: 'Online Now', value: formatPlayerList(view.players) });
  }
  if (footer) {
    embed.setFooter({ text: footer });
  }

  return embed;
}

/**
 * event: { type: 'online' | 'offline' | 'join' | 'leave', count?, playerCount?, maxPlayers? }
 */
export function buildEventEmbed(event) {
  const embed = new EmbedBuilder().setTimestamp();
  const capacity = `${event.playerCount}/${event.maxPlayers ?? '?'} online`;

  switch (event.type) {
    case 'online':
      return embed.setColor(COLORS.online).setDescription(`🟢 **Server is back online** — ${capacity}`);
    case 'offline':
      return embed.setColor(COLORS.offline).setDescription('🔴 **Server went offline**');
    case 'join': {
      const who = event.count === 1 ? 'A player joined' : `${event.count} players joined`;
      return embed.setColor(COLORS.join).setDescription(`👋 **${who}** — ${capacity}`);
    }
    case 'leave': {
      const who = event.count === 1 ? 'A player left' : `${event.count} players left`;
      return embed.setColor(COLORS.leave).setDescription(`🚪 **${who}** — ${capacity}`);
    }
  }
}
