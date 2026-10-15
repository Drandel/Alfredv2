import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)).replace(/^\/([A-Z]:)/, '$1');
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'enshrouded.json');

// `online` is null until the first conclusive check, so a fresh install doesn't post a state-change event.
let store = {
  statusMessageId: null,
  online: null,
  since: null,
  name: null,
  version: null,
  playerCount: 0,
  maxPlayers: null,
};

export function load() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DATA_FILE)) {
    store = { ...store, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) };
  }
}

function save() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

export function get() {
  return store;
}

export function update(patch) {
  store = { ...store, ...patch };
  save();
}
