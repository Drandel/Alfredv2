export default {
  name: 'ping',
  async execute(message) {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`Pong! Latency: **${latency}ms** | API: **${message.client.ws.ping}ms**`);
  },
};
