const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Giveaway, Participant, Log, Blacklist } = require('../database/GiveawayModel');
const giveawayEmbeds = require('../utils/giveawayEmbeds');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Slash komutları
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
      }
    }
    // Modal submit işlemleri
    else if (interaction.isModalSubmit()) {
      // /create modali
      if (interaction.customId === 'create_modal') {
        const prize = interaction.fields.getTextInputValue('prize_input');
        const durationRaw = interaction.fields.getTextInputValue('duration_input');
        const winnersRaw = interaction.fields.getTextInputValue('winners_input');
        const description = interaction.fields.getTextInputValue('description_input');

        const duration = parseInt(durationRaw);
        const winnerCount = parseInt(winnersRaw);
        if (isNaN(duration) || isNaN(winnerCount)) {
          return interaction.reply({ content: 'Duration and number of winners must be valid numbers.', ephemeral: true });
        }

        // Unique çekiliş kodu üret
        let code = giveawayEmbeds.generateGiveawayCode();
        let exists = await Giveaway.findOne({ where: { code } });
        while (exists) {
          code = giveawayEmbeds.generateGiveawayCode();
          exists = await Giveaway.findOne({ where: { code } });
        }

        const newGiveaway = await Giveaway.create({
          code: code,
          guildId: interaction.guild.id,
          creatorId: interaction.user.id,
          prize: prize,
          duration: duration,
          winnerCount: winnerCount,
          description: description,
          status: 'inactive',
          controlChannelId: interaction.channel.id,
          startTime: Date.now(),
          endTime: Date.now() + duration * 60 * 1000 // Set endTime correctly
        });

        // Gönderilecek kontrol paneli mesajı
        const embed = giveawayEmbeds.createControlEmbed(newGiveaway);
        const components = giveawayEmbeds.getControlButtons(newGiveaway);
        const controlMessage = await interaction.channel.send({ embeds: [embed], components: components });
        newGiveaway.messageId = controlMessage.id;
        await newGiveaway.save();

        return interaction.reply({ content: `Giveaway created with code **${code}**. Set the target channel using /channel command.`, ephemeral: true });
      }
      // Edit modali (customId: "edit_modal_{code}")
      else if (interaction.customId.startsWith('edit_modal_')) {
        const code = interaction.customId.split('_').pop();
        const giveaway = await Giveaway.findOne({ where: { code } });
        if (!giveaway) {
          return interaction.reply({ content: 'Giveaway not found.', ephemeral: true });
        }
        if (giveaway.creatorId !== interaction.user.id) {
          return interaction.reply({ content: 'Only the giveaway creator can edit it.', ephemeral: true });
        }
        const prize = interaction.fields.getTextInputValue('prize_input');
        const durationRaw = interaction.fields.getTextInputValue('duration_input');
        const winnersRaw = interaction.fields.getTextInputValue('winners_input');
        const description = interaction.fields.getTextInputValue('description_input');

        const duration = parseInt(durationRaw);
        const winnerCount = parseInt(winnersRaw);
        if (isNaN(duration) || isNaN(winnerCount)) {
          return interaction.reply({ content: 'Duration and number of winners must be valid numbers.', ephemeral: true });
        }
        giveaway.prize = prize;
        giveaway.duration = duration;
        giveaway.winnerCount = winnerCount;
        giveaway.description = description;
        giveaway.endTime = giveaway.startTime + duration * 60 * 1000; // Update endTime
        await giveaway.save();

        // Güncellenmiş kontrol panelini gönder
        const embed = giveawayEmbeds.createControlEmbed(giveaway);
        const components = giveawayEmbeds.getControlButtons(giveaway);
        const channel = client.channels.cache.get(giveaway.controlChannelId);
        if (channel) {
          try {
            const msg = await channel.messages.fetch(giveaway.messageId);
            if (msg) await msg.edit({ embeds: [embed], components: components });
          } catch (err) {
            console.error(err);
          }
        }
        return interaction.reply({ content: 'Giveaway updated successfully.', ephemeral: true });
      }
    }
    // Buton etkileşimleri
    else if (interaction.isButton()) {
      const [action, code] = interaction.customId.split('_');
      const giveaway = await Giveaway.findOne({ where: { code } });
      if (!giveaway) {
        return interaction.reply({ content: 'Giveaway not found!', ephemeral: true });
      }

      // Blacklist kontrolü (varsa)
      const blacklisted = await Blacklist.findOne({ where: { userId: interaction.user.id } });
      if (blacklisted) {
        return interaction.reply({ content: 'You are blacklisted from participating in giveaways.', ephemeral: true });
      }

      if (action === 'join') {
        if (giveaway.status !== 'active' && giveaway.status !== 'claim') {
          return interaction.reply({ content: 'This giveaway is not active.', ephemeral: true });
        }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        // Opsiyonel: Rol kontrolleri eklenebilir (/requiredroles gibi ayrı komutlarla ayarlanır)
        const requiredRoles = giveaway.requiredRoles;
        if (requiredRoles.length > 0 && !requiredRoles.some(roleId => member.roles.cache.has(roleId))) {
          return interaction.reply({ content: 'You do not have the required roles to join this giveaway.', ephemeral: true });
        }
        try {
          await Participant.create({ giveawayId: giveaway.id, userId: interaction.user.id });
          await Log.create({ giveawayId: giveaway.id, userId: interaction.user.id, action: 'joined' });

          // Katılımcı sayısını güncelle
          const participantCount = await Participant.count({ where: { giveawayId: giveaway.id } });
          giveaway.participantCount = participantCount;
          await giveaway.save();

          // Kontrol paneli mesajını güncelle
          const embed = giveawayEmbeds.createControlEmbed(giveaway);
          const components = giveawayEmbeds.getControlButtons(giveaway);
          const controlChannel = client.channels.cache.get(giveaway.controlChannelId);
          if (controlChannel) {
            try {
              const controlMessage = await controlChannel.messages.fetch(giveaway.messageId);
              if (controlMessage) await controlMessage.edit({ embeds: [embed], components: components });
            } catch (err) {
              console.error(err);
            }
          }

          // Hedef kanaldaki mesajı güncelle
          if (giveaway.targetChannelId) {
            const targetChannel = client.channels.cache.get(giveaway.targetChannelId);
            if (targetChannel) {
              try {
                const targetMessage = await targetChannel.messages.fetch(giveaway.messageId);
                if (targetMessage) {
                  const targetEmbed = giveawayEmbeds.createGiveawayEmbed(giveaway);
                  await targetMessage.edit({ embeds: [targetEmbed] });
                }
              } catch (err) {
                console.error(err);
              }
            }
          }

          return interaction.reply({ content: 'You have joined the giveaway!', ephemeral: true });
        } catch (err) {
          console.error(err);
          return interaction.reply({ content: 'You have already joined this giveaway.', ephemeral: true });
        }
      }
      else if (action === 'edit') {
        // Sadece çekilişi oluşturan kullanıcı edit yapabilir.
        if (giveaway.creatorId !== interaction.user.id) {
          return interaction.reply({ content: 'Only the giveaway creator can edit it.', ephemeral: true });
        }
        // Edit modali göster: Mevcut verileri yeniden girmeniz istenecek (Discord modalları varsayılan değer desteklemez)
        const modal = new ModalBuilder()
          .setCustomId(`edit_modal_${giveaway.code}`)
          .setTitle('Edit Giveaway');

        const prizeInput = new TextInputBuilder()
          .setCustomId('prize_input')
          .setLabel('Prize')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter the new prize')
          .setRequired(true);

        const durationInput = new TextInputBuilder()
          .setCustomId('duration_input')
          .setLabel('Duration (in minutes)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter new duration (minutes)')
          .setRequired(true);

        const winnersInput = new TextInputBuilder()
          .setCustomId('winners_input')
          .setLabel('Number of Winners')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter new number of winners')
          .setRequired(true);

        const descriptionInput = new TextInputBuilder()
          .setCustomId('description_input')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Enter new description')
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(prizeInput),
          new ActionRowBuilder().addComponents(durationInput),
          new ActionRowBuilder().addComponents(winnersInput),
          new ActionRowBuilder().addComponents(descriptionInput)
        );
        await interaction.showModal(modal);
      }
      else if (action === 'send') {
        if (giveaway.status !== 'active') {
          return interaction.reply({ content: 'This giveaway is not active.', ephemeral: true });
        }
        const targetChannel = client.channels.cache.get(giveaway.targetChannelId);
        if (!targetChannel) {
          return interaction.reply({ content: 'Target channel not found.', ephemeral: true });
        }
        const embed = giveawayEmbeds.createGiveawayEmbed(giveaway);
        const joinButton = new ButtonBuilder()
          .setCustomId(`join_${giveaway.code}`)
          .setLabel('Join Giveaway')
          .setStyle(ButtonStyle.Success);
        const viewParticipantsButton = new ButtonBuilder()
          .setCustomId(`view_${giveaway.code}`)
          .setLabel('View Participants')
          .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(joinButton, viewParticipantsButton);
        const message = await targetChannel.send({ embeds: [embed], components: [row] });
        giveaway.messageId = message.id;
        await giveaway.save();
        return interaction.reply({ content: 'Giveaway panel sent to the target channel.', ephemeral: true });
      }
      else if (action === 'stop') {
        if (giveaway.status !== 'active') {
          return interaction.reply({ content: 'This giveaway is not active.', ephemeral: true });
        }
        giveaway.status = 'completed';
        await giveaway.save();

        // Güncellenmiş kontrol panelini gönder
        const embed = giveawayEmbeds.createControlEmbed(giveaway);
        const components = giveawayEmbeds.getControlButtons(giveaway);
        const channel = client.channels.cache.get(giveaway.controlChannelId);
        if (channel) {
          try {
            const msg = await channel.messages.fetch(giveaway.messageId);
            if (msg) await msg.edit({ embeds: [embed], components: components });
          } catch (err) {
            console.error(err);
          }
        }
        return interaction.reply({ content: 'Giveaway has been stopped.', ephemeral: true });
      }
      else if (action === 'view') {
        const participants = await Participant.findAll({ where: { giveawayId: giveaway.id } });
        const participantList = participants.map(p => `<@${p.userId}>`).join('\n') || 'No participants yet.';
        return interaction.reply({ content: `Participants:\n${participantList}`, ephemeral: true });
      }
      else {
        return interaction.reply({ content: 'Unknown action!', ephemeral: true });
      }
    }
  }
};