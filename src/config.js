import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildIds: process.env.GUILD_IDS ? process.env.GUILD_IDS.split(',').map(id => id.trim()) : [],
  prefix: process.env.PREFIX || '!',
};
