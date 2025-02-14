# DiscordGiveawayBOT-Advanced

A Discord bot for managing giveaways with advanced features.

## Features

- Create giveaways with interactive menus
- Set required roles for joining giveaways
- Manage giveaways with control panel (start, stop, send, cancel)
- View participants of a giveaway
- Automatically update participant count
- Blacklist users from participating in giveaways

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/daraekin/DiscordGiveawayBOT-Advanced
    cd DiscordGiveawayBOT-Advanced
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a [config.json](http://_vscodecontentref_/0) file in the [src](http://_vscodecontentref_/1) directory with your bot token and client ID:
    ```json
    {
      "token": "YOUR_BOT_TOKEN",
      "clientId": "YOUR_CLIENT_ID",
      "defaultPrefix": "!",
      "embedColor": "#0099ff"
    }
    ```

4. Deploy the commands to Discord:
    ```sh
    npm run deploy
    ```

5. Start the bot:
    ```sh
    npm start
    ```

## Usage

### Commands

- `/create` - Create a new giveaway via interactive menu
- `/channel` - Set the target channel for a giveaway
- `/requiredroles` - Set required roles for a giveaway

### Control Panel

- **Edit** - Edit the giveaway details
- **Start** - Start the giveaway
- **Stop** - Stop the giveaway
- **Send** - Send the giveaway panel to the target channel
- **Join Giveaway** - Join the giveaway
- **View Participants** - View the participants of the giveaway

### Example

1. Create a new giveaway:
    - Use the `/create` command to open the interactive menu and fill in the details.

2. Set the target channel:
    - Use the `/channel` command to set the channel where the giveaway will be sent.

3. Manage the giveaway:
    - Use the control panel to start, stop, send, or cancel the giveaway.

4. Join the giveaway:
    - Users can click the "Join Giveaway" button to participate.

5. View participants:
    - Click the "View Participants" button to see the list of participants.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
