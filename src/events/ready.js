import { Events } from 'discord.js';
import * as steamNewsStorage from '../services/steamNewsStorage.js';
import * as steamNewsChecker from '../services/steamNewsChecker.js';
import * as enshroudedMonitor from '../services/enshroudedMonitor.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);

    steamNewsStorage.load();
    steamNewsChecker.start(client);
    enshroudedMonitor.start(client);
  },
};
