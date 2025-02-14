const { 
  SlashCommandBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('Create a new giveaway via interactive menu'),
  async execute(interaction, client) {
    // Modal oluştur
    const modal = new ModalBuilder()
      .setCustomId('create_modal')
      .setTitle('Create Giveaway');

    const prizeInput = new TextInputBuilder()
      .setCustomId('prize_input')
      .setLabel('Prize')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the prize for the giveaway')
      .setRequired(true);

    const durationInput = new TextInputBuilder()
      .setCustomId('duration_input')
      .setLabel('Duration (in minutes)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., 10')
      .setRequired(true);

    const winnersInput = new TextInputBuilder()
      .setCustomId('winners_input')
      .setLabel('Number of Winners')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., 1')
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('description_input')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter a description for the giveaway')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(prizeInput),
      new ActionRowBuilder().addComponents(durationInput),
      new ActionRowBuilder().addComponents(winnersInput),
      new ActionRowBuilder().addComponents(descriptionInput)
    );

    await interaction.showModal(modal);
  },
};