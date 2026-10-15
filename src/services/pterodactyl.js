import { config } from '../config.js';

// Pterodactyl client API (Pine Hosting panel). All panel access goes through this module.
// The API key is IP-restricted in the panel, so these calls only work from the production droplet.

export function isConfigured() {
  const { panelUrl, apiKey, serverId } = config.pterodactyl;
  return Boolean(panelUrl && apiKey && serverId);
}

async function request(method, path, body) {
  const { panelUrl, apiKey, serverId } = config.pterodactyl;
  const res = await fetch(`${panelUrl}/api/client/servers/${serverId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'Application/vnd.pterodactyl.v1+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const detail = data?.errors?.[0]?.detail ?? res.statusText;
    throw new Error(`Panel API ${res.status}: ${detail}`);
  }
  return res.status === 204 ? null : res.json();
}

// signal: 'start' | 'stop' | 'restart' | 'kill'
export async function sendPowerSignal(signal) {
  await request('POST', '/power', { signal });
}

// Returns { state: 'running' | 'starting' | 'stopping' | 'offline', uptimeMs }
export async function getServerState() {
  const data = await request('GET', '/resources');
  return {
    state: data.attributes.current_state,
    uptimeMs: data.attributes.resources.uptime,
  };
}
