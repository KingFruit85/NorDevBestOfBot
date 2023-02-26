const { SlashCommandBuilder, EmbedBuilder, Client } = require("discord.js");
const dotenv = require("dotenv");

dotenv.config();

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_CONNECTION_STRING);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("GetThisMonthsTopComments Connected successfully");
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getthismonthstopcomments")
    .setDescription("Returns the top five comments of the month so far"),

  async execute(interaction) {
    let topFiveCommentEmbeds = [];
    const postColours = ["#F44336", "#00BCD4", "#9C27B0", "#FFC107", "#4CAF50"];
    const date = new Date();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    const startDateOfCurrentMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    );
    const lastDayOfCurrentMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    );

    const topComments = await db
      .collection(interaction.guildId)
      .find({
        dateOfSubmission: {
          $gte: startDateOfCurrentMonth,
          $lt: lastDayOfCurrentMonth,
        },
      })
      .sort({ voteCount: -1 })
      .limit(5)
      .toArray();

    if (topComments.length === 0) {
      return await interaction.reply({
        content: "There have been no comments nominated this month, sad times",
        ephemeral: true,
      });
    }

    const headerMessage = new EmbedBuilder()
      .setColor([255, 0, 255])
      .setTitle(`The top 5 comments for ${month} ${year}`);

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

    return await interaction.reply({
      embeds: topFiveCommentEmbeds,
    });
  },
};
