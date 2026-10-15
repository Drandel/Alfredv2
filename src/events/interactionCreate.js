import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Persistent buttons use a "<commandName>:<action>" custom ID and route to that command's handleButton
    if (interaction.isButton()) {
      const command = interaction.client.commands.get(interaction.customId.split(':')[0]);
      if (!command?.handleButton) return;

      try {
        await command.handleButton(interaction);
      } catch (error) {
        console.error(`Error handling button ${interaction.customId}:`, error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'Something went wrong with that button.', ephemeral: true });
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing /${interaction.commandName}:`, error);
      const reply = { content: 'Something went wrong running that command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  },
};
