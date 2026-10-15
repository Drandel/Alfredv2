import { GameDig } from 'gamedig';
import { config } from '../config.js';

export function isConfigured() {
  return Boolean(config.enshrouded.host);
}

export function connectAddress() {
  return `${config.enshrouded.host}:${config.enshrouded.queryPort}`;
}

// Queries the server over Steam A2S. Throws if the server doesn't answer.
// Enshrouded reports player entries but leaves their names blank, so `name` is usually null.
export async function queryServer() {
  const result = await GameDig.query({
    type: 'enshrouded',
    host: config.enshrouded.host,
    port: config.enshrouded.queryPort,
    givenPortOnly: true,
    maxRetries: 1,
    socketTimeout: 3000,
  });

  return {
    name: result.name,
    version: result.version || null,
    password: Boolean(result.password),
    playerCount: result.numplayers ?? result.players.length,
    maxPlayers: result.maxplayers,
    players: result.players.map(p => ({
      name: p.name || null,
      seconds: p.raw?.time ?? null,
    })),
  };
}
