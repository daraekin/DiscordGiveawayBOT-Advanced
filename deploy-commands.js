const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./src/config.json');

const commands = [];
const commandFiles = fs
  .readdirSync(path.join(__dirname, 'src', 'commands'))
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'src', 'commands', file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} global application (/) commands.`);
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands }
    );
    console.log(`Successfully reloaded global application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
