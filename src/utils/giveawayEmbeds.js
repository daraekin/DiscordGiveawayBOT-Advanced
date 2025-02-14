const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

function generateGiveawayCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createControlEmbed(giveaway) {
  const embed = new EmbedBuilder()
    .setTitle(`Giveaway: ${giveaway.prize}`)
    .setColor(config.embedColor)
    .setTimestamp();

  let description = `**Code:** ${giveaway.code}\n**Winners:** ${giveaway.winnerCount}\n**Duration:** ${giveaway.duration} minute(s)\n**Entries:** ${giveaway.participantCount || 0}`;
  if (giveaway.description) {
    description += `\n**Description:** ${giveaway.description}`;
  }
  if (!giveaway.targetChannelId) {
    description += `\n\n⚠️ *Target channel not set – use /channel command to set it.*`;
  }
  if (giveaway.requiredRoles.length > 0) {
    const roles = giveaway.requiredRoles.map(roleId => `<@&${roleId}>`).join(', ');
    description += `\n**Required Roles:** ${roles}`;
  }
  embed.setDescription(description);

  return embed;
}

function getControlButtons(giveaway) {
  const buttons = [];
  if (giveaway.status === 'inactive') {
    buttons.push(new ButtonBuilder()
      .setCustomId(`edit_${giveaway.code}`)
      .setLabel('Edit')
      .setStyle(ButtonStyle.Primary));
    if (giveaway.targetChannelId) {
      buttons.push(new ButtonBuilder()
        .setCustomId(`start_${giveaway.code}`)
        .setLabel('Start')
        .setStyle(ButtonStyle.Success));
    }
  } else if (giveaway.status === 'active') {
    buttons.push(new ButtonBuilder()
      .setCustomId(`cancel_${giveaway.code}`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger));
    buttons.push(new ButtonBuilder()
      .setCustomId(`send_${giveaway.code}`)
      .setLabel('Send')
      .setStyle(ButtonStyle.Primary));
  } else if (giveaway.status === 'completed') {
    buttons.push(new ButtonBuilder()
      .setCustomId(`cancel_${giveaway.code}`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger));
  }

  buttons.push(new ButtonBuilder()
    .setCustomId(`join_${giveaway.code}`)
    .setLabel('Join Giveaway')
    .setStyle(ButtonStyle.Success));

  buttons.push(new ButtonBuilder()
    .setCustomId(`view_${giveaway.code}`)
    .setLabel('View Participants')
    .setStyle(ButtonStyle.Secondary));

  return [new ActionRowBuilder().addComponents(buttons)];
}

function createGiveawayEmbed(giveaway, creator) {
  const embed = new EmbedBuilder()
    .setTitle(`Giveaway: ${giveaway.prize}`)
    .setColor(config.embedColor)
    .setTimestamp();
  let description = `**Code:** ${giveaway.code}\n**Entries:** ${giveaway.participantCount || 0}\n**Winners:** ${giveaway.winnerCount}\n**Hosted by:** <@${creator}>`;
  if (giveaway.description) {
    description += `\n**Description:** ${giveaway.description}`;
  }
  const endTimestamp = Math.floor(giveaway.endTime / 1000);
  description += `\n**Time Remaining:** <t:${endTimestamp}:R>`;
  embed.setDescription(description);
  return embed;
}

module.exports = { generateGiveawayCode, createControlEmbed, getControlButtons, createGiveawayEmbed };