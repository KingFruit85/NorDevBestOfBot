const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const dotenv = require("dotenv");
dotenv.config();
const KeyvMongo = require("@keyvhq/mongo");
const Keyv = require("keyv");

const bestOfTable = new Keyv({
  store: new KeyvMongo(process.env.DATABASE_CONNECTION_STRING, {
    collection: "bestoftable",
  }),
});

const holdingTable = new Keyv({
  store: new KeyvMongo(process.env.DATABASE_CONNECTION_STRING, {
    collection: "holdingtable",
  }),
});

bestOfTable.on("error", (err) => console.error("Keyv connection error:", err));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nominate")
    .setDescription("Nominates a message to be included in the best of list")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("a valid message link")
        .setRequired(true)
    ),

  async execute(interaction) {
    let requestingUser = interaction.member.user;
    let input = interaction.options.getString("input");
    let messageId = input.split("/")[input.split("/").length - 1];
    let channelId = input.split("/")[input.split("/").length - 2];
    let serverId = input.split("/")[input.split("/").length - 3];

    if (await bestOfTable.get(input)) {
      await interaction.reply({
        content: "This comment has already been added to the best of table",
        ephemeral: true,
      });
    }

    let currentNumberOfVotes = 0;
    if (await holdingTable.get(input)) {
      currentNumberOfVotes = await holdingTable.get(input);
    }

    if (
      messageId.length === 0 ||
      channelId.length === 0 ||
      serverId.length === 0
    ) {
      interaction.reply({
        content: "Please provide a valid message link",
        ephemeral: true,
      });
    }

    // Get the channel object using the channel ID
    let channel = interaction.client.channels.cache.get(channelId);
    // Retrieve the message using the message ID
    let message = await channel.messages.fetch(messageId);

    // This happens if the message is an image  I think
    if (message.content.length <= 0) {
      interaction.reply({
        content: "You can't nominate a message that doesn't include text",
        ephemeral: true,
      });
    }

    // also embed images?
    const nominatedMessage = new EmbedBuilder()
      .setDescription(message.content || " ")
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setColor("#13f857");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("I Agree!")
        .setCustomId(`YesVote - ${input}`)
        .setStyle(ButtonStyle.Success)
        .setEmoji("👍"),
      new ButtonBuilder()
        .setLabel("I Disagree")
        .setCustomId(`NoVote - ${input}`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji("👎")
    );

    await interaction.reply({
      content: `${requestingUser} has nominated the following message to be added to the best of list`,
      embeds: [nominatedMessage],
      components: [row],
    });
  },
};

// https://gist.github.com/scragly/b8d20aece2d058c8c601b44a689a47a0
