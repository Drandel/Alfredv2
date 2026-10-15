import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildIds: process.env.GUILD_IDS ? process.env.GUILD_IDS.split(',').map(id => id.trim()) : [],
  prefix: process.env.PREFIX || '!',
  steamApiKey: process.env.STEAM_API_KEY || '',
  enshrouded: {
    host: process.env.ENS_HOST || '',
    queryPort: Number(process.env.ENS_QUERY_PORT) || 15637,
    channelId: process.env.ENS_CHANNEL_ID || '',
    pollIntervalSeconds: Number(process.env.ENS_POLL_INTERVAL_SECONDS) || 60,
    offlineThreshold: Number(process.env.ENS_OFFLINE_THRESHOLD) || 3,
  },
};
