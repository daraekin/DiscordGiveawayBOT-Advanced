const { SlashCommandBuilder } = require('discord.js');
const { Giveaway } = require('../database/GiveawayModel');
const giveawayEmbeds = require('../utils/giveawayEmbeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('requiredroles')
    .setDescription('Set required role for a giveaway')
    .addStringOption(option =>
      option.setName('giveaway_id')
        .setDescription('The giveaway code')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Select a role that is required to join')
        .setRequired(true)),
  async execute(interaction) {
    const giveawayId = interaction.options.getString('giveaway_id');
    const role = interaction.options.getRole('role');
    const giveaway = await Giveaway.findOne({ where: { code: giveawayId } });
    if (!giveaway) {
      return interaction.reply({ content: 'Giveaway not found.', ephemeral: true });
    }
    if (giveaway.creatorId !== interaction.user.id) {
      return interaction.reply({ content: 'Only the giveaway creator can set required roles.', ephemeral: true });
    }
    let roles = giveaway.requiredRoles;
    if (!roles.includes(role.id)) {
      roles.push(role.id);
    }
    giveaway.requiredRoles = roles;
    await giveaway.save();

    // Kontrol paneli mesajını güncelle
    const embed = giveawayEmbeds.createControlEmbed(giveaway);
    const components = giveawayEmbeds.getControlButtons(giveaway);
    const controlChannel = interaction.guild.channels.cache.get(giveaway.controlChannelId);
    if (controlChannel) {
      try {
        const controlMessage = await controlChannel.messages.fetch(giveaway.messageId);
        if (controlMessage) await controlMessage.edit({ embeds: [embed], components: components });
      } catch (err) {
        console.error(err);
      }
    }

    return interaction.reply({ content: `Role <@&${role.id}> added as required for giveaway **${giveawayId}**.`, ephemeral: true });
  }
};