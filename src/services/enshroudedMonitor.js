import { config } from '../config.js';
import * as storage from './enshroudedStorage.js';
import { queryServer, isConfigured } from './enshroudedQuery.js';
import { buildStatusEmbed, buildEventEmbed } from './enshroudedEmbeds.js';

const INITIAL_DELAY = 5 * 1000; // 5 seconds
const UNKNOWN_MESSAGE = 10008;

let intervalId = null;
let polling = false;
let consecutiveFailures = 0;
let lastPlayers = []; // player list isn't persisted; it refills on the next successful query
let lastCheckedAt = Date.now();
let lastIssue = null;

// Logs a channel/message problem once instead of every poll until it changes or recovers.
function logIssue(message) {
  if (message === lastIssue) return;
  lastIssue = message;
  console.warn(`[Enshrouded] ${message}`);
}

function handleFailure(err, now) {
  consecutiveFailures++;
  const threshold = config.enshrouded.offlineThreshold;
  console.warn(`[Enshrouded] Query failed (${consecutiveFailures}/${threshold}): ${err.message}`);

  const prev = storage.get();
  if (consecutiveFailures < threshold || prev.online === false) return [];

  lastPlayers = [];
  storage.update({ online: false, since: now, playerCount: 0 });
  return prev.online === true ? [{ type: 'offline' }] : [];
}

function handleSuccess(snapshot, now) {
  consecutiveFailures = 0;
  lastPlayers = snapshot.players;

  const prev = storage.get();
  const capacity = { playerCount: snapshot.playerCount, maxPlayers: snapshot.maxPlayers };
  const events = [];

  if (prev.online === false) {
    events.push({ type: 'online', ...capacity });
  } else if (prev.online === true) {
    const delta = snapshot.playerCount - prev.playerCount;
    if (delta > 0) events.push({ type: 'join', count: delta, ...capacity });
    if (delta < 0) events.push({ type: 'leave', count: -delta, ...capacity });
  }

  const changed = prev.online !== true
    || prev.playerCount !== snapshot.playerCount
    || prev.maxPlayers !== snapshot.maxPlayers
    || prev.name !== snapshot.name
    || prev.version !== snapshot.version;

  if (changed) {
    storage.update({
      online: true,
      since: prev.online === true ? prev.since : now,
      name: snapshot.name,
      version: snapshot.version,
      ...capacity,
    });
  }

  return events;
}

function currentView() {
  const state = storage.get();
  return {
    ...state,
    players: state.online ? lastPlayers : [],
    checkedAt: lastCheckedAt,
  };
}

async function upsertStatusMessage(channel) {
  const payload = {
    embeds: [buildStatusEmbed(currentView(), `Updates every ${config.enshrouded.pollIntervalSeconds}s`)],
  };
  const { statusMessageId } = storage.get();

  if (statusMessageId) {
    try {
      await channel.messages.edit(statusMessageId, payload);
      return;
    } catch (err) {
      if (err.code !== UNKNOWN_MESSAGE) throw err;
      console.warn('[Enshrouded] Status message was deleted — posting a new one');
    }
  }

  const message = await channel.send(payload);
  storage.update({ statusMessageId: message.id });
}

async function publish(client, events) {
  let channel;
  try {
    channel = await client.channels.fetch(config.enshrouded.channelId);
  } catch (err) {
    logIssue(`Can't reach channel ${config.enshrouded.channelId}: ${err.message}`);
    return;
  }
  if (!channel?.isTextBased()) {
    logIssue(`Channel ${config.enshrouded.channelId} is not a text channel`);
    return;
  }

  for (const event of events) {
    try {
      await channel.send({ embeds: [buildEventEmbed(event)] });
    } catch (err) {
      console.error(`[Enshrouded] Failed to post ${event.type} event:`, err.message);
    }
  }

  try {
    await upsertStatusMessage(channel);
    lastIssue = null;
  } catch (err) {
    logIssue(`Can't update status message: ${err.message}`);
  }
}

async function poll(client) {
  if (polling) return;
  polling = true;

  try {
    const now = Date.now();
    let events;
    try {
      const snapshot = await queryServer();
      events = handleSuccess(snapshot, now);
    } catch (err) {
      events = handleFailure(err, now);
    }
    lastCheckedAt = now;
    await publish(client, events);
  } catch (err) {
    console.error('[Enshrouded] Poll failed:', err);
  } finally {
    polling = false;
  }
}

export function start(client) {
  if (intervalId) return;

  if (!isConfigured() || !config.enshrouded.channelId) {
    console.log('[Enshrouded] ENS_HOST or ENS_CHANNEL_ID not set — monitor disabled');
    return;
  }

  storage.load();

  setTimeout(() => {
    poll(client);
    intervalId = setInterval(() => poll(client), config.enshrouded.pollIntervalSeconds * 1000);
  }, INITIAL_DELAY);

  console.log(`[Enshrouded] Monitoring ${config.enshrouded.host}:${config.enshrouded.queryPort} every ${config.enshrouded.pollIntervalSeconds}s`);
}
