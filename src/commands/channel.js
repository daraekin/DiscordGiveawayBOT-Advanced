const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { Giveaway } = require('../database/GiveawayModel');
const giveawayEmbeds = require('../utils/giveawayEmbeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel')
    .setDescription('Set the target channel for a giveaway (required to start the giveaway)')
    .addStringOption(option =>
      option.setName('giveaway_id')
        .setDescription('The giveaway code')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Select the channel to send the giveaway')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),
  async execute(interaction) {
    const giveawayId = interaction.options.getString('giveaway_id');
    const channel = interaction.options.getChannel('channel');
    const giveaway = await Giveaway.findOne({ where: { code: giveawayId } });
    if (!giveaway) {
      return interaction.reply({ content: 'Giveaway not found.', ephemeral: true });
    }
    if (giveaway.creatorId !== interaction.user.id) {
      return interaction.reply({ content: 'Only the giveaway creator can set the channel.', ephemeral: true });
    }
    giveaway.targetChannelId = channel.id;
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

    // Send butonunu eklemek için kontrol panelini güncelle
    if (giveaway.status === 'inactive' && giveaway.targetChannelId) {
      giveaway.status = 'active';
      await giveaway.save();
      const updatedEmbed = giveawayEmbeds.createControlEmbed(giveaway);
      const updatedComponents = giveawayEmbeds.getControlButtons(giveaway);
      if (controlChannel) {
        try {
          const controlMessage = await controlChannel.messages.fetch(giveaway.messageId);
          if (controlMessage) await controlMessage.edit({ embeds: [updatedEmbed], components: updatedComponents });
        } catch (err) {
          console.error(err);
        }
      }
    }

    return interaction.reply({ content: `Target channel for giveaway **${giveawayId}** has been set to <#${channel.id}>.`, ephemeral: true });
  }
};