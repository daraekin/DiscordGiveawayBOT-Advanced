const { Giveaway, Participant, Log, Archive } = require('../database/GiveawayModel');
const { createGiveawayEmbed } = require('./giveawayEmbeds');
const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function pickWinners(participants, count) {
  if (participants.length === 0) return [];
  const shuffled = participants.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function checkGiveaways(client) {
  const activeGiveaways = await Giveaway.findAll({ where: { status: 'active' } });
  const now = Date.now();
  for (const giveaway of activeGiveaways) {
    // Eğer çekilişin başlangıç zamanı ve bitiş zamanı ayarlanmışsa
    if (giveaway.endTime && now >= giveaway.endTime) {
      giveaway.status = 'completed';
      await giveaway.save();
      // Kazananları belirleme vs. işlemleri burada yapabilirsiniz.
      // Örneğin: katılımcılar arasından kazanan seç, duyuru gönder, vs.
      const participants = await Participant.findAll({ where: { giveawayId: giveaway.id } });
      const winners = pickWinners(participants, giveaway.winnerCount);
      giveaway.winners = winners.map(w => w.userId);
      await giveaway.save();

      if (giveaway.targetChannelId) {
        const channel = client.channels.cache.get(giveaway.targetChannelId);
        if (channel) {
          const embed = createGiveawayEmbed(giveaway, giveaway.creatorId);
          embed.addFields({ name: 'Winners', value: winners.map(w => `<@${w.userId}>`).join(', ') || 'No winners' });
          channel.send({ embeds: [embed] });
        }
      }
    } else {
      // Update the giveaway embed with the remaining time
      if (giveaway.targetChannelId) {
        const channel = client.channels.cache.get(giveaway.targetChannelId);
        if (channel) {
          try {
            const msg = await channel.messages.fetch(giveaway.messageId);
            if (msg) {
              const embed = createGiveawayEmbed(giveaway, giveaway.creatorId);
              await msg.edit({ embeds: [embed] });
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
    }
  }
}

module.exports = {
  start(client) {
    setInterval(() => {
      checkGiveaways(client);
    }, 5000); // Check every 5 seconds
  }
};