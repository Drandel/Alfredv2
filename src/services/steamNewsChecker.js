import { EmbedBuilder } from 'discord.js';
import { config } from '../config.js';
import * as storage from './steamNewsStorage.js';

const POLL_INTERVAL = 60 * 60 * 1000; // 1 hour
const INITIAL_DELAY = 30 * 1000; // 30 seconds

let intervalId = null;

function stripBBCode(text) {
  return text
    .replace(/\[\/?\w+[^\]]*\]/g, '')
    .replace(/\{STEAM_CLAN_IMAGE\}[^\s]*/g, '')
    .replace(/\{STEAM_CLAN_LOC_IMAGE\}[^\s]*/g, '')
    .trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

export async function fetchNews(appId) {
  if (!config.steamApiKey) return [];
  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=15&maxlength=0&format=json&key=${config.steamApiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.appnews?.newsitems ?? [];
}

export async function fetchGameName(appId) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data[appId]?.success) return null;
  return data[appId].data.name;
}

export async function seedExistingNews(guildId, appId) {
  const items = await fetchNews(appId);
  const officialItems = items.filter(i => i.feed_type === 1);
  if (officialItems.length > 0) {
    storage.markNewsSeen(guildId, appId, officialItems.map(i => i.gid));
  }
}

function buildEmbed(item, gameName) {
  const description = truncate(stripBBCode(item.contents || ''), 300);
  const embed = new EmbedBuilder()
    .setTitle(item.title)
    .setURL(item.url)
    .setDescription(description)
    .setColor(0x1b2838)
    .setFooter({ text: gameName })
    .setTimestamp(new Date(item.date * 1000));

  const headerImage = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${item.appid}/header.jpg`;
  embed.setThumbnail(headerImage);

  return embed;
}

export async function checkGuild(client, guildId, guildConfig) {
  if (!guildConfig.channelId || guildConfig.games.length === 0) return 0;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return 0;

  let channel;
  try {
    channel = await guild.channels.fetch(guildConfig.channelId);
  } catch {
    return 0;
  }
  if (!channel) return 0;

  let totalNew = 0;

  for (const game of guildConfig.games) {
    try {
      const items = await fetchNews(game.appId);
      const officialItems = items.filter(i => i.feed_type === 1);
      const newItems = officialItems.filter(i => !storage.isNewsSeen(guildId, game.appId, i.gid));

      if (newItems.length === 0) continue;

      // Post oldest first
      newItems.reverse();

      for (const item of newItems) {
        const embed = buildEmbed(item, game.name);
        await channel.send({ embeds: [embed] });
      }

      storage.markNewsSeen(guildId, game.appId, newItems.map(i => i.gid));
      totalNew += newItems.length;
    } catch (err) {
      console.error(`[SteamNews] Error checking ${game.name} (${game.appId}) for guild ${guildId}:`, err.message);
    }
  }

  return totalNew;
}

async function pollAll(client) {
  if (!config.steamApiKey) return;

  for (const [guildId, guildConfig] of storage.getAllGuilds()) {
    if (!guildConfig.enabled) continue;
    try {
      await checkGuild(client, guildId, guildConfig);
    } catch (err) {
      console.error(`[SteamNews] Error polling guild ${guildId}:`, err.message);
    }
  }
}

export function start(client) {
  if (intervalId) return;

  setTimeout(() => {
    pollAll(client);
    intervalId = setInterval(() => pollAll(client), POLL_INTERVAL);
  }, INITIAL_DELAY);

  console.log('[SteamNews] Background checker scheduled');
}
