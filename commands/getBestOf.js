const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");

dotenv.config();

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_CONNECTION_STRING);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Get Best Of Connected successfully");
});

const postColours = ["#F44336", "#00BCD4", "#9C27B0", "#FFC107", "#4CAF50"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getbestof")
    .setDescription("Returns the top ten best of comments"),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    let topComments = await db
      .collection(interaction.guildId)
      .find()
      .sort({ voteCount: -1 })
      .limit(5)
      .toArray();

    let topFiveCommentEmbeds = [];

    const date = new Date();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    const headerMessage = new EmbedBuilder()
      .setColor([255, 0, 255])
      .setTitle(`The top 5 comments from ${month} ${year}`);

    topFiveCommentEmbeds.push(headerMessage);

    counter = 0;
    topComments.forEach((comment) => {
      if (comment.quotedMessage) {
        let _quotedComment = new EmbedBuilder()
          .setTitle(
            `A conversation between ${comment.quotedMessageAuthor} and ${comment.userName}`
          )
          .setDescription(comment.quotedMessage)
          .setAuthor({
            name: comment.quotedMessageAuthor,
            iconURL: comment.quotedMessageAvatarLink,
          })
          .setColor(postColours[counter]);

        if (comment.quotedMessageImage) {
          _quotedComment.setImage(comment.quotedMessageImage);
        }

        topFiveCommentEmbeds.push(_quotedComment);
      }

      let _votedComment = new EmbedBuilder()
        .setDescription(comment.comment)
        .setAuthor({
          name: comment.userName,
          iconURL: comment.iconUrl,
        })
        .setColor(postColours[counter])
        .setFooter({ text: `Votes: ${comment.voteCount}` });

      if (comment.imageUrl && comment.imageUrl.includes("http")) {
        _votedComment.setImage(comment.imageUrl);
      }

      topFiveCommentEmbeds.push(_votedComment);
      counter++;
    });

    await interaction.editReply({
      embeds: topFiveCommentEmbeds,
    });
  },
};
