const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

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
    let input = interaction.options.getString("input"); // Input is a message link
    let message = "";
    let channel = "";
    let messageId = input.split("/")[input.split("/").length - 1];
    let channelId = input.split("/")[input.split("/").length - 2];
    let serverId = input.split("/")[input.split("/").length - 3];

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
    channel = interaction.client.channels.cache.get(channelId);
    console.log(channel);
    // Retrieve the message using the message ID
    message = await channel.messages.fetch(messageId);
    console.log(message);

    const exampleEmbed = new EmbedBuilder()
      .setDescription(message.content)
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      });
    exampleEmbed.setColor(0x7289da);
    console.log(
      "------------------------------------------------------------------"
    );
    // console.log("REACTIONS: ", message.reactions);
    let count = 0;
    message.reactions.cache.forEach((element) => {
      if (element._emoji.name === "👀") {
        count = element.count;
      }
    });

    // console.log(messageReactions);

    channel.send({ embeds: [exampleEmbed] });
    await interaction.reply(
      `${requestingUser} has nominated the following message to be added to the best of list, it still requires  ${
        5 - count
      } 👀 reactions to be added to the best of list Link:${input}`
    );
  },
};
