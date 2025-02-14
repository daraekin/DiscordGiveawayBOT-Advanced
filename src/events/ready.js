module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}!`);
    const scheduler = require('../utils/scheduler');
    scheduler.start(client);
  },
};
