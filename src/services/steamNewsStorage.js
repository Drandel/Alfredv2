import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)).replace(/^\/([A-Z]:)/, '$1');
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'steamNews.json');

const MAX_TRACKED_IDS = 50;

let store = {};

export function load() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DATA_FILE)) {
    store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
}

function save() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

export function getGuild(guildId) {
  if (!store[guildId]) {
    store[guildId] = {
      enabled: false,
      channelId: null,
      games: [],
      trackedNewsIds: {},
    };
  }
  return store[guildId];
}

export function setEnabled(guildId, enabled, channelId) {
  const guild = getGuild(guildId);
  guild.enabled = enabled;
  if (channelId !== undefined) guild.channelId = channelId;
  save();
}

export function addGame(guildId, appId, name) {
  const guild = getGuild(guildId);
  if (guild.games.some(g => g.appId === appId)) return false;
  guild.games.push({ appId, name });
  if (!guild.trackedNewsIds[appId]) guild.trackedNewsIds[appId] = [];
  save();
  return true;
}

export function removeGame(guildId, appId) {
  const guild = getGuild(guildId);
  const idx = guild.games.findIndex(g => g.appId === appId);
  if (idx === -1) return false;
  guild.games.splice(idx, 1);
  delete guild.trackedNewsIds[appId];
  save();
  return true;
}

export function markNewsSeen(guildId, appId, newsIds) {
  const guild = getGuild(guildId);
  if (!guild.trackedNewsIds[appId]) guild.trackedNewsIds[appId] = [];
  guild.trackedNewsIds[appId].push(...newsIds);
  if (guild.trackedNewsIds[appId].length > MAX_TRACKED_IDS) {
    guild.trackedNewsIds[appId] = guild.trackedNewsIds[appId].slice(-MAX_TRACKED_IDS);
  }
  save();
}

export function isNewsSeen(guildId, appId, newsId) {
  const guild = getGuild(guildId);
  return guild.trackedNewsIds[appId]?.includes(newsId) ?? false;
}

export function getAllGuilds() {
  return Object.entries(store);
}
