const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const RequiredEmojiCount = 5;

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
    let input = interaction.options.getString("input"); // Input should be a message link
    let messageId = input.split("/")[input.split("/").length - 1];
    let channelId = input.split("/")[input.split("/").length - 2];
    let serverId = input.split("/")[input.split("/").length - 3];

    // Should probably check if it's already on the best of list right?

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
    const exampleEmbed = new EmbedBuilder()
      .setDescription(message.content)
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      })
      .setColor("#13f857");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Vote For Message")
        .setCustomId(`YesVote - ${input}`)
        .setStyle(ButtonStyle.Success)
        .setEmoji("👍"),
      new ButtonBuilder()
        .setLabel("Vote Against Message")
        .setCustomId(`NoVote - ${input}`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji("👎")
    );

    let alreadyInBestOfMsg = "";
    let yetToBeAddedMsg = "";

    await interaction.reply({
      content: `${requestingUser} has nominated the following message to be added to the best of list, but it still requires ${"PLACEHOLDER"} votes`,
      embeds: [exampleEmbed],
      components: [row],
    });
  },
};

// https://gist.github.com/scragly/b8d20aece2d058c8c601b44a689a47a0
