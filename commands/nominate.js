const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nominate")
    .setDescription("Nominates a message to be included in the best of list")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("the input to echo back")
        .setRequired(true)
    ),

  async execute(interaction) {
    let requestingUser = interaction.member.user;
    let input = interaction.options.getString("input"); // Input is a message link

    // ADD VALIDATION, return if invalid message link is provided

    let messageId = input.split("/")[input.split("/").length - 1];
    let channelId = input.split("/")[input.split("/").length - 2];
    let serverId = input.split("/")[input.split("/").length - 3];

    // Get the channel object using the channel ID
    const channel = interaction.client.channels.cache.get(channelId);

    // Retrieve the message using the message ID
    let message = await channel.messages.fetch(messageId);

    const exampleEmbed = new EmbedBuilder()
      .setDescription(message.content)
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      });
    exampleEmbed.setColor(0x7289da);

    channel.send({ embeds: [exampleEmbed] }).catch(console.error);

    await interaction.reply(
      `${requestingUser} has nominated the following message to be added to the best of list`
    );
  },
};
