import { config } from '../config.js';
import * as storage from './enshroudedStorage.js';
import { queryServer, isConfigured } from './enshroudedQuery.js';
import { buildStatusEmbed } from './enshroudedEmbeds.js';
import * as pterodactyl from './pterodactyl.js';

const INITIAL_DELAY = 5 * 1000; // 5 seconds
const UNKNOWN_MESSAGE = 10008;
const RESTART_TIMEOUT = 10 * 60 * 1000; // give up on "Restarting…" after 10 minutes

let intervalId = null;
let monitorClient = null;
let restart = null; // { userId, requestedAt } while a restart from Discord is in progress
let polling = false;
let consecutiveFailures = 0;
let lastPlayers = []; // player list isn't persisted; it refills on the next successful query
let lastRendered = null; // skip Discord edits when the status embed hasn't changed
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

  // Downtime during a requested restart is expected, so don't report it as an outage
  if (restart || consecutiveFailures < threshold || storage.get().online === false) return;

  lastPlayers = [];
  storage.update({ online: false, since: now, playerCount: 0 });
}

function handleSuccess(snapshot, now) {
  consecutiveFailures = 0;
  lastPlayers = snapshot.players;

  const prev = storage.get();
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
      playerCount: snapshot.playerCount,
      maxPlayers: snapshot.maxPlayers,
    });
  }
}

// A restart is done once the panel shows a process started after the request and the game answers queries again.
async function checkRestartDone(querySucceeded, now) {
  if (!restart) return;
  if (now - restart.requestedAt > RESTART_TIMEOUT) {
    console.warn('[Enshrouded] Restart still not confirmed after 10 minutes — resuming normal monitoring');
    restart = null;
    return;
  }
  if (!querySucceeded) return;

  try {
    const { state, uptimeMs } = await pterodactyl.getServerState();
    if (state === 'running' && uptimeMs < now - restart.requestedAt) {
      console.log('[Enshrouded] Restart complete');
      restart = null;
      storage.update({ online: true, since: now });
    }
  } catch (err) {
    console.warn('[Enshrouded] Could not check panel state:', err.message);
  }
}

function currentView() {
  const state = storage.get();
  return { ...state, players: state.online ? lastPlayers : [], restarting: restart };
}

async function upsertStatusMessage(channel, embed) {
  const payload = { embeds: [embed] };
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

async function publish(client) {
  const embed = buildStatusEmbed(currentView(), `Checks every ${config.enshrouded.pollIntervalSeconds}s`);
  const rendered = JSON.stringify(embed.toJSON());
  if (rendered === lastRendered) return;

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

  try {
    await upsertStatusMessage(channel, embed);
    lastRendered = rendered;
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
    let querySucceeded = false;
    try {
      handleSuccess(await queryServer(), now);
      querySucceeded = true;
    } catch (err) {
      handleFailure(err, now);
    }
    await checkRestartDone(querySucceeded, now);
    await publish(client);
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
  monitorClient = client;

  setTimeout(() => {
    poll(client);
    intervalId = setInterval(() => poll(client), config.enshrouded.pollIntervalSeconds * 1000);
  }, INITIAL_DELAY);

  console.log(`[Enshrouded] Monitoring ${config.enshrouded.host}:${config.enshrouded.queryPort} every ${config.enshrouded.pollIntervalSeconds}s`);
}

// Called after a restart is sent to the panel: shows "Restarting…" right away and pauses outage detection.
export function markRestarting(userId) {
  if (!monitorClient) return;
  restart = { userId, requestedAt: Date.now() };
  publish(monitorClient).catch(err => console.error('[Enshrouded] Failed to show restart status:', err));
}
