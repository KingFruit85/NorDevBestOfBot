const {
  SlashCommandBuilder,
  Client,
  GatewayIntentBits,
} = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const dotenv = require("dotenv");
dotenv.config();
client.token = process.env.DISCORD_TOKEN;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nominate")
    .setDescription("Nominates a message to be included in the best of list")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("the input to echo back")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The channel to echo into")
    ),

  async execute(interaction) {
    // Get the username of the requestor
    let user = interaction.user.username;
    let input = interaction.options.getString("input");
    let messageId = input.split("/")[input.split("/").length - 1];
    let channelId = input.split("/")[input.split("/").length - 2];
    let serverId = input.split("/")[input.split("/").length - 3];

    await interaction.reply(
      `${user} has nominated the following message to be added to the best of list ${input}`
    );
  },
};

// Or the nominate just checks the message link for an existing number of emojis?

// Message link : https://discord.com/channels/1054500338947858522/1054500340063555606/1054524934459768862
// [0] = Server Id
// [1] = Channel Id
// [2] = Message Id
